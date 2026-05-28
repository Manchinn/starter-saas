const Redis = require('ioredis')
const config = require('./config')
const log = require('../core/logger').forLabel('cache')

/**
 * Unified cache with two interchangeable backends:
 *   • Redis (ioredis) when config.redis.enabled is true
 *   • an in-process Map otherwise
 *
 * Callers always use the same async API (get/set/del/flush/wrap) and never
 * need to know which backend is active. Redis failures degrade gracefully —
 * reads return null and writes are dropped rather than throwing — so a cache
 * outage never takes down a request path.
 */

// ── Internal state ─────────────────────────────────────────────────────────
let client = null            // ioredis instance when Redis is active
let useRedis = false
const memory = new Map()      // key → { value, expiresAt } (expiresAt: ms epoch, 0 = no expiry)

// Periodically evict expired in-memory entries so the Map can't grow unbounded
// for write-once-never-read keys. Unref'd so it never keeps the process alive.
const sweeper = setInterval(() => {
  if (useRedis) return
  const now = Date.now()
  for (const [k, entry] of memory) {
    if (entry.expiresAt && entry.expiresAt < now) memory.delete(k)
  }
}, 60_000)
if (typeof sweeper.unref === 'function') sweeper.unref()

// ── Helpers ────────────────────────────────────────────────────────────────
const prefixed = (key) => `${config.redis.keyPrefix || ''}${key}`

function memGet(key) {
  const entry = memory.get(key)
  if (!entry) return null
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memory.delete(key)
    return null
  }
  return entry.value
}

function memSet(key, value, ttlSeconds) {
  memory.set(key, {
    value,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
  })
}

/**
 * Build an ioredis client from a config-shaped object. Exported so install-time
 * endpoints can probe user-supplied credentials without touching the live
 * client. `extra` overrides defaults (e.g. fast-fail options for a probe).
 */
function buildRedisClient(cfg, extra = {}) {
  return new Redis({
    host:      cfg.host || '127.0.0.1',
    port:      cfg.port || 6379,
    password:  cfg.password || undefined,
    db:        cfg.db || 0,
    keyPrefix: cfg.keyPrefix || '',
    ...extra,
  })
}

function attachHandlers(c) {
  c.on('connect', () => log.info('Redis connected'))
  c.on('error',   (err) => log.warn(`Redis error: ${err.message}`))
  c.on('close',   () => log.warn('Redis connection closed'))
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
/**
 * (Re)point the cache at the given config. Tears down any existing client,
 * then either connects to Redis or switches to the in-memory backend. Throws
 * if Redis is enabled but unreachable — callers decide whether that's fatal
 * (install-time probe) or should fall back (boot-time init).
 */
async function reconfigure(redisCfg) {
  await disconnect()

  if (!redisCfg.enabled) {
    useRedis = false
    log.info('Redis disabled — using in-memory cache')
    return { enabled: false }
  }

  const c = buildRedisClient(redisCfg, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  })
  attachHandlers(c)
  await c.connect()
  client = c
  useRedis = true
  return { enabled: true }
}

/**
 * Boot-time initialisation. Never throws: if Redis is enabled but unreachable
 * we log and fall back to memory so the server still starts.
 */
async function init() {
  try {
    await reconfigure(config.redis)
  } catch (err) {
    useRedis = false
    log.warn(`Redis unavailable (${err.message}); falling back to in-memory cache`)
  }
}

async function disconnect() {
  if (!client) return
  try { await client.quit() } catch { /* already gone */ }
  client = null
  useRedis = false
}

// ── Cache operations ────────────────────────────────────────────────────────
async function get(key) {
  if (useRedis && client) {
    try {
      const raw = await client.get(key)
      return raw == null ? null : JSON.parse(raw)
    } catch (err) {
      log.warn(`cache get failed (${key}): ${err.message}`)
      return null
    }
  }
  return memGet(prefixed(key))
}

async function set(key, value, ttlSeconds = config.redis.ttl) {
  if (useRedis && client) {
    try {
      const raw = JSON.stringify(value)
      if (ttlSeconds > 0) await client.set(key, raw, 'EX', ttlSeconds)
      else                await client.set(key, raw)
    } catch (err) {
      log.warn(`cache set failed (${key}): ${err.message}`)
    }
    return
  }
  memSet(prefixed(key), value, ttlSeconds)
}

async function del(key) {
  if (useRedis && client) {
    try { await client.del(key) } catch (err) { log.warn(`cache del failed (${key}): ${err.message}`) }
    return
  }
  memory.delete(prefixed(key))
}

async function flush() {
  if (useRedis && client) {
    try { await client.flushdb() } catch (err) { log.warn(`cache flush failed: ${err.message}`) }
    return
  }
  memory.clear()
}

/**
 * Get-or-compute: return the cached value, or run `producer`, cache its result,
 * and return it. The single most common cache pattern.
 */
async function wrap(key, ttlSeconds, producer) {
  const cached = await get(key)
  if (cached !== null && cached !== undefined) return cached
  const fresh = await producer()
  if (fresh !== null && fresh !== undefined) await set(key, fresh, ttlSeconds)
  return fresh
}

function isRedis() { return useRedis }

module.exports = {
  init,
  reconfigure,
  disconnect,
  get,
  set,
  del,
  flush,
  wrap,
  isRedis,
  buildRedisClient,
}
