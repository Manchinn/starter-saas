const fs = require('fs')
const path = require('path')
const { Sequelize } = require('sequelize')
const config = require('../../config/config')
const { User } = require('../../models')
const sequelize = require('../../config/database')
const cache = require('../../config/redis')

// `dotenv` is loaded from process.cwd() by app.js, and npm runs the workspace
// scripts with cwd = server/. So .env lives at server/.env (not the repo root).
const SERVER_ROOT = path.resolve(__dirname, '..', '..')
const ENV_PATH = path.join(SERVER_ROOT, '.env')

const SUPPORTED_DIALECTS = ['sqlite', 'postgres', 'mysql', 'mariadb', 'mssql']

/**
 * The DB-selection endpoints only run pre-install. Once an admin exists we
 * refuse — switching DBs after install would orphan the existing data.
 */
async function assertPreInstall() {
  const adminCount = await User.count()
  if (adminCount > 0) {
    throw { status: 403, message: 'Application is already installed; database cannot be changed from the install screen.' }
  }
}

function validatePayload(p) {
  const dialect = (p?.dialect || '').toLowerCase()
  if (!SUPPORTED_DIALECTS.includes(dialect)) {
    throw { status: 400, message: `Unsupported dialect "${p?.dialect}". Supported: ${SUPPORTED_DIALECTS.join(', ')}` }
  }
  if (dialect === 'sqlite') return { dialect, storage: (p.storage || '').trim() || './data/database.sqlite' }
  if (!p.host?.trim())     throw { status: 400, message: 'Host is required' }
  if (!p.database?.trim()) throw { status: 400, message: 'Database name is required' }
  if (!p.username?.trim()) throw { status: 400, message: 'Username is required' }
  return {
    dialect,
    host:     p.host.trim(),
    port:     p.port ? parseInt(p.port, 10) : undefined,
    database: p.database.trim(),
    username: p.username.trim(),
    password: p.password || '',
  }
}

/**
 * Open a throwaway connection with the supplied credentials and verify the
 * server actually reachable. We close it immediately — this is just a probe.
 */
async function testConnection(payload) {
  await assertPreInstall()
  const cfg = validatePayload(payload)
  const testSequelize = sequelize.buildSequelize({ ...cfg, logging: false })
  try {
    await testSequelize.authenticate()
    return { dialect: cfg.dialect, message: 'Connection successful' }
  } catch (err) {
    throw { status: 400, message: `Connection failed: ${err.message}` }
  } finally {
    try { await testSequelize.close() } catch {}
  }
}

const ENV_KEYS_BY_DIALECT = {
  sqlite:   ['DB_DIALECT', 'DB_STORAGE'],
  postgres: ['DB_DIALECT', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
  mysql:    ['DB_DIALECT', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
  mariadb:  ['DB_DIALECT', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
  mssql:    ['DB_DIALECT', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
}

function payloadToEnvMap(cfg) {
  if (cfg.dialect === 'sqlite') {
    return { DB_DIALECT: 'sqlite', DB_STORAGE: cfg.storage }
  }
  return {
    DB_DIALECT:  cfg.dialect,
    DB_HOST:     cfg.host,
    DB_PORT:     cfg.port ? String(cfg.port) : '',
    DB_NAME:     cfg.database,
    DB_USER:     cfg.username,
    DB_PASSWORD: cfg.password,
  }
}

/**
 * Read the current .env into a key→value map (preserving comments would
 * complicate the rewrite — for an install-time one-shot, a clean rewrite of
 * the DB keys is fine; existing non-DB keys are preserved).
 */
function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {}
  const text = fs.readFileSync(ENV_PATH, 'utf8')
  const map = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const k = line.slice(0, eq).trim()
    let v = line.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    map[k] = v
  }
  return map
}

function writeEnv(map) {
  const lines = Object.entries(map).map(([k, v]) => {
    const needsQuote = v && /[\s#"']/.test(v)
    const value = needsQuote ? `"${v.replace(/"/g, '\\"')}"` : (v ?? '')
    return `${k}=${value}`
  })
  fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf8')
}

/**
 * Persist a new DB selection. The flow:
 *   1. Validate connection works (so we never write a broken .env).
 *   2. Rewrite .env, replacing the DB_* keys for the chosen dialect and
 *      removing keys that no longer apply (sqlite ⇄ relational).
 *   3. Self-terminate so the process manager (nodemon / pm2 / systemd)
 *      restarts the server with the new config picked up at boot.
 * The client polls /api/health to know when the server is back.
 */
async function configureDb(payload) {
  await assertPreInstall()
  const cfg = validatePayload(payload)

  // 1. Probe — refuse to write a config we know is broken.
  const probe = sequelize.buildSequelize({ ...cfg, logging: false })
  try {
    await probe.authenticate()
  } catch (err) {
    throw { status: 400, message: `Connection failed: ${err.message}` }
  } finally {
    try { await probe.close() } catch {}
  }

  // 2. Rewrite .env.
  const env = readEnv()
  // Drop the DB_* keys that aren't relevant to the chosen dialect (e.g.
  // sqlite leaves no DB_HOST behind; postgres clears DB_STORAGE).
  const newKeys = new Set(ENV_KEYS_BY_DIALECT[cfg.dialect])
  for (const k of Object.keys(env)) {
    if (k.startsWith('DB_') && !newKeys.has(k)) delete env[k]
  }
  Object.assign(env, payloadToEnvMap(cfg))
  writeEnv(env)

  // 3. Hand off to the process manager. The 250ms delay lets express finish
  // the response cycle before the process dies.
  setTimeout(() => process.exit(0), 250)

  return { dialect: cfg.dialect, restartRequired: true, message: 'Database configured. Server is restarting.' }
}

function dbStatus() {
  return {
    dialect: config.db.dialect,
    sqlite:  config.db.dialect === 'sqlite',
  }
}

// ── Redis / cache ─────────────────────────────────────────────────────────────
const REDIS_ENV_KEYS = ['REDIS_ENABLED', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD', 'REDIS_DB']

function validateRedisPayload(p) {
  const enabled = p?.enabled === true || p?.enabled === 'true'
  if (!enabled) return { enabled: false }
  const port = p.port ? parseInt(p.port, 10) : 6379
  if (!Number.isInteger(port) || port <= 0) throw { status: 400, message: 'Invalid Redis port' }
  return {
    enabled:  true,
    host:     (p.host || '').trim() || '127.0.0.1',
    port,
    password: p.password || '',
    db:       p.db ? parseInt(p.db, 10) : 0,
  }
}

// Merge install-supplied connection details with the non-user-facing defaults
// (key prefix, default TTL) so the cache module gets a complete config.
function toCacheCfg(cfg) {
  return cfg.enabled
    ? { ...cfg, keyPrefix: config.redis.keyPrefix, ttl: config.redis.ttl }
    : { enabled: false }
}

function redisPayloadToEnvMap(cfg) {
  if (!cfg.enabled) return { REDIS_ENABLED: 'false' }
  return {
    REDIS_ENABLED:  'true',
    REDIS_HOST:     cfg.host,
    REDIS_PORT:     String(cfg.port),
    REDIS_PASSWORD: cfg.password || '',
    REDIS_DB:       String(cfg.db || 0),
  }
}

function applyRedisProcessEnv(cfg) {
  const map = redisPayloadToEnvMap(cfg)
  for (const k of REDIS_ENV_KEYS) {
    if (map[k] === undefined) delete process.env[k]
    else process.env[k] = map[k]
  }
}

/** Open a throwaway client and PING, failing fast (no retries). */
async function probeRedis(cacheCfg) {
  const client = cache.buildRedisClient(cacheCfg, {
    lazyConnect:          true,
    maxRetriesPerRequest: 1,
    retryStrategy:        () => null,
    connectTimeout:       4000,
  })
  client.on('error', () => {}) // prevent unhandled 'error' from crashing the process
  try {
    await client.connect()
    await client.ping()
  } catch (err) {
    throw { status: 400, message: `Connection failed: ${err.message}` }
  } finally {
    try { client.disconnect() } catch {}
  }
}

async function testRedis(payload) {
  await assertPreInstall()
  const cfg = validateRedisPayload(payload)
  if (!cfg.enabled) throw { status: 400, message: 'Redis is disabled — nothing to test.' }
  await probeRedis(toCacheCfg(cfg))
  return { message: 'Connection successful' }
}

/**
 * Persist the Redis selection and apply it live. Unlike the DB switch, the
 * cache backend can be re-pointed at runtime, so we update .env + process.env
 * and call cache.reconfigure() — no server restart required.
 */
async function configureRedis(payload) {
  await assertPreInstall()
  const cfg = validateRedisPayload(payload)
  if (cfg.enabled) await probeRedis(toCacheCfg(cfg))

  const env = readEnv()
  for (const k of Object.keys(env)) if (k.startsWith('REDIS_')) delete env[k]
  Object.assign(env, redisPayloadToEnvMap(cfg))
  writeEnv(env)

  applyRedisProcessEnv(cfg)
  try {
    await cache.reconfigure(toCacheCfg(cfg))
  } catch (err) {
    throw { status: 400, message: `Connection failed: ${err.message}` }
  }

  return {
    enabled: cfg.enabled,
    message: cfg.enabled ? 'Redis enabled.' : 'Redis disabled; using in-memory cache.',
  }
}

function redisStatus() {
  return {
    enabled:   process.env.REDIS_ENABLED === 'true',
    connected: cache.isRedis(),
  }
}

module.exports = {
  testConnection, configureDb, dbStatus, SUPPORTED_DIALECTS,
  testRedis, configureRedis, redisStatus,
}
