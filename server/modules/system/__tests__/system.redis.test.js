// Security unit tests for modules/system.service — the Redis (cache) selection
// flow and the install guard that protects every system-config endpoint.
//
// These endpoints are unauthenticated by design (they run on the install screen
// before any admin exists), so the ONLY thing standing between an attacker and
// "re-point the cache / rewrite .env / probe arbitrary internal hosts" is
// assertPreInstall(): once a user row exists, every mutating + probing endpoint
// must refuse. The existing suite proves that for the DB endpoints; this file
// proves it for the Redis endpoints and pins the connection-probe and
// .env-rewrite behaviour (stale secrets are dropped, throwaway clients closed).
//
// fs is mocked so no real .env is read or written; the cache module is mocked so
// no real Redis client is opened.

jest.mock('../../../models', () => ({ User: { count: jest.fn() } }))
jest.mock('../../../config/database', () => ({ buildSequelize: jest.fn() }))
jest.mock('../../../config/config', () => ({
  db: { dialect: 'sqlite' },
  redis: { keyPrefix: 'app:', ttl: 3600 },
}))
jest.mock('../../../config/redis', () => ({
  buildRedisClient: jest.fn(),
  reconfigure: jest.fn(),
  isRedis: jest.fn(),
}))
jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(() => ''),
  writeFileSync: jest.fn(),
}))

const fs = require('fs')
const { User } = require('../../../models')
const cache = require('../../../config/redis')
const service = require('../system.service')

// A throwaway Redis client whose connect/ping resolve (or reject) on demand.
const makeClient = ({ fail = false } = {}) => ({
  on: jest.fn(),
  connect: jest.fn(fail ? () => Promise.reject(new Error('ECONNREFUSED')) : () => Promise.resolve()),
  ping: jest.fn().mockResolvedValue('PONG'),
  disconnect: jest.fn(),
})

// Snapshot the REDIS_* env so applyRedisProcessEnv mutations don't leak.
let savedEnv
beforeEach(() => {
  savedEnv = { ...process.env }
  cache.reconfigure.mockResolvedValue()
})
afterEach(() => {
  for (const k of Object.keys(process.env)) if (k.startsWith('REDIS_')) delete process.env[k]
  Object.assign(process.env, savedEnv)
})

describe('system Redis endpoints — install guard (the core security control)', () => {
  test('testRedis refuses once an admin/user exists', async () => {
    User.count.mockResolvedValue(1)
    await expect(service.testRedis({ enabled: true, host: 'h' }))
      .rejects.toMatchObject({ status: 403, message: expect.stringContaining('already installed') })
    expect(cache.buildRedisClient).not.toHaveBeenCalled()
  })

  test('configureRedis refuses once installed — no probe, no .env write', async () => {
    User.count.mockResolvedValue(1)
    await expect(service.configureRedis({ enabled: true, host: 'h' }))
      .rejects.toMatchObject({ status: 403, message: expect.stringContaining('already installed') })
    expect(cache.buildRedisClient).not.toHaveBeenCalled()
    expect(cache.reconfigure).not.toHaveBeenCalled()
    expect(fs.writeFileSync).not.toHaveBeenCalled()
  })
})

describe('system.validateRedisPayload — via testRedis (pre-install)', () => {
  beforeEach(() => { User.count.mockResolvedValue(0) })

  test('rejects a non-numeric port before opening any client', async () => {
    await expect(service.testRedis({ enabled: true, port: 'not-a-port' }))
      .rejects.toEqual({ status: 400, message: 'Invalid Redis port' })
    expect(cache.buildRedisClient).not.toHaveBeenCalled()
  })

  test('rejects a non-positive port', async () => {
    await expect(service.testRedis({ enabled: true, port: '0' }))
      .rejects.toEqual({ status: 400, message: 'Invalid Redis port' })
  })

  test('refuses to "test" a disabled config (nothing to probe)', async () => {
    await expect(service.testRedis({ enabled: false }))
      .rejects.toEqual({ status: 400, message: 'Redis is disabled — nothing to test.' })
    expect(cache.buildRedisClient).not.toHaveBeenCalled()
  })

  test('treats only boolean true / "true" as enabled (no truthy-string coercion)', async () => {
    // enabled:'1' must NOT count as enabled — otherwise stray values silently
    // turn the cache on. It should fall through to the disabled-guard.
    await expect(service.testRedis({ enabled: '1' }))
      .rejects.toEqual({ status: 400, message: 'Redis is disabled — nothing to test.' })
  })
})

describe('system.testRedis — connection probe', () => {
  beforeEach(() => { User.count.mockResolvedValue(0) })

  test('returns success and disconnects the throwaway client on a good PING', async () => {
    const client = makeClient()
    cache.buildRedisClient.mockReturnValue(client)
    const out = await service.testRedis({ enabled: true, host: '127.0.0.1', port: '6379' })
    expect(out).toEqual({ message: 'Connection successful' })
    expect(client.disconnect).toHaveBeenCalled()
  })

  test('surfaces a 400 and still disconnects when the probe fails', async () => {
    const client = makeClient({ fail: true })
    cache.buildRedisClient.mockReturnValue(client)
    await expect(service.testRedis({ enabled: true, host: '10.0.0.5' }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Connection failed') })
    expect(client.disconnect).toHaveBeenCalled() // no leaked throwaway connection
  })

  test('probes with fail-fast options so a hung host cannot stall the request', async () => {
    const client = makeClient()
    cache.buildRedisClient.mockReturnValue(client)
    await service.testRedis({ enabled: true, host: 'h' })
    const opts = cache.buildRedisClient.mock.calls[0][1]
    expect(opts).toMatchObject({ lazyConnect: true, maxRetriesPerRequest: 1 })
    expect(opts.connectTimeout).toBeGreaterThan(0)
    expect(typeof opts.retryStrategy).toBe('function')
    expect(opts.retryStrategy()).toBeNull() // never retries
  })
})

describe('system.configureRedis — .env rewrite hygiene', () => {
  beforeEach(() => { User.count.mockResolvedValue(0) })

  test('disabling Redis writes REDIS_ENABLED=false without probing a server', async () => {
    await service.configureRedis({ enabled: false })
    expect(cache.buildRedisClient).not.toHaveBeenCalled() // no probe when turning off
    expect(fs.writeFileSync).toHaveBeenCalled()
    const written = fs.writeFileSync.mock.calls[0][1]
    expect(written).toMatch(/REDIS_ENABLED=false/)
    expect(cache.reconfigure).toHaveBeenCalledWith({ enabled: false })
  })

  test('rewriting the cache config drops any stale REDIS_* secret from .env', async () => {
    // .env already holds an old Redis password and an unrelated key.
    fs.existsSync.mockReturnValue(true)
    fs.readFileSync.mockReturnValue('DB_DIALECT=sqlite\nREDIS_PASSWORD=old-secret\nREDIS_HOST=old-host\n')
    await service.configureRedis({ enabled: false })
    const written = fs.writeFileSync.mock.calls[0][1]
    expect(written).not.toContain('old-secret') // stale secret purged
    expect(written).not.toContain('old-host')
    expect(written).toMatch(/DB_DIALECT=sqlite/) // unrelated keys preserved
  })

  test('enabling Redis probes first, then persists and applies live (no restart)', async () => {
    const client = makeClient()
    cache.buildRedisClient.mockReturnValue(client)
    const out = await service.configureRedis({ enabled: true, host: '127.0.0.1', port: '6379', password: 'pw' })
    expect(client.connect).toHaveBeenCalled() // probed before writing
    expect(fs.writeFileSync).toHaveBeenCalled()
    expect(process.env.REDIS_ENABLED).toBe('true')
    expect(cache.reconfigure).toHaveBeenCalled()
    expect(out).toMatchObject({ enabled: true })
  })

  test('a reconfigure failure surfaces as 400 (bad config is not silently accepted)', async () => {
    const client = makeClient()
    cache.buildRedisClient.mockReturnValue(client)
    cache.reconfigure.mockRejectedValue(new Error('NOAUTH'))
    await expect(service.configureRedis({ enabled: true, host: 'h' }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Connection failed') })
  })
})

describe('system.redisStatus', () => {
  test('reports enabled from env and connected from the live cache', () => {
    process.env.REDIS_ENABLED = 'true'
    cache.isRedis.mockReturnValue(true)
    expect(service.redisStatus()).toEqual({ enabled: true, connected: true })
  })

  test('enabled=false for any non-"true" env value', () => {
    process.env.REDIS_ENABLED = 'yes'
    cache.isRedis.mockReturnValue(false)
    expect(service.redisStatus()).toEqual({ enabled: false, connected: false })
  })
})
