// Unit tests for modules/system.service — the pre-install DB selection flow.
//
// We exercise the install-guard (refuses once an admin exists), the payload
// validation rules, and the connection probe (success + failure). configureDb's
// success path rewrites .env and self-terminates via process.exit, so we only
// drive its guard/validation branches here.

jest.mock('../../../models', () => ({ User: { count: jest.fn() } }))
jest.mock('../../../config/database', () => ({ buildSequelize: jest.fn() }))
jest.mock('../../../config/config', () => ({ db: { dialect: 'sqlite' } }))

const { User } = require('../../../models')
const sequelize = require('../../../config/database')
const config = require('../../../config/config')
const service = require('../system.service')

const okProbe = () => ({ authenticate: jest.fn().mockResolvedValue(), close: jest.fn().mockResolvedValue() })

describe('system.testConnection — install guard', () => {
  test('refuses once an admin/user exists', async () => {
    User.count.mockResolvedValue(1)
    await expect(service.testConnection({ dialect: 'sqlite' }))
      .rejects.toMatchObject({ status: 403, message: expect.stringContaining('already installed') })
  })
})

describe('system.testConnection — payload validation', () => {
  beforeEach(() => { User.count.mockResolvedValue(0) }) // pre-install

  test('rejects an unsupported dialect', async () => {
    await expect(service.testConnection({ dialect: 'oracle' }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Unsupported dialect') })
  })

  test('relational dialects require host / database / username', async () => {
    await expect(service.testConnection({ dialect: 'postgres' }))
      .rejects.toEqual({ status: 400, message: 'Host is required' })
    await expect(service.testConnection({ dialect: 'postgres', host: 'h' }))
      .rejects.toEqual({ status: 400, message: 'Database name is required' })
    await expect(service.testConnection({ dialect: 'postgres', host: 'h', database: 'd' }))
      .rejects.toEqual({ status: 400, message: 'Username is required' })
  })
})

describe('system.testConnection — connection probe', () => {
  beforeEach(() => { User.count.mockResolvedValue(0) })

  test('returns success and closes the probe when authenticate resolves', async () => {
    const probe = okProbe()
    sequelize.buildSequelize.mockReturnValue(probe)
    const out = await service.testConnection({ dialect: 'sqlite' })
    expect(out).toEqual({ dialect: 'sqlite', message: 'Connection successful' })
    expect(probe.close).toHaveBeenCalled()
  })

  test('surfaces a 400 with the driver error when authenticate fails', async () => {
    const probe = { authenticate: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')), close: jest.fn().mockResolvedValue() }
    sequelize.buildSequelize.mockReturnValue(probe)
    await expect(service.testConnection({ dialect: 'sqlite' }))
      .rejects.toEqual({ status: 400, message: 'Connection failed: ECONNREFUSED' })
    expect(probe.close).toHaveBeenCalled() // probe is closed even on failure
  })
})

describe('system.configureDb — guards', () => {
  test('refuses once installed', async () => {
    User.count.mockResolvedValue(1)
    await expect(service.configureDb({ dialect: 'sqlite' }))
      .rejects.toMatchObject({ status: 403 })
  })

  test('validates the payload before probing', async () => {
    User.count.mockResolvedValue(0)
    await expect(service.configureDb({ dialect: 'oracle' }))
      .rejects.toMatchObject({ status: 400, message: expect.stringContaining('Unsupported dialect') })
    expect(sequelize.buildSequelize).not.toHaveBeenCalled()
  })
})

describe('system.dbStatus', () => {
  test('reports the active dialect and a sqlite flag', () => {
    expect(service.dbStatus()).toEqual({ dialect: 'sqlite', sqlite: true })
  })

  test('sqlite flag is false for other dialects', () => {
    config.db.dialect = 'postgres'
    expect(service.dbStatus()).toEqual({ dialect: 'postgres', sqlite: false })
    config.db.dialect = 'sqlite' // restore for other tests
  })
})

describe('system.serializeEnv', () => {
  test('strips newlines and ignores invalid keys so values cannot inject .env entries', () => {
    const result = service.serializeEnv({
      DB_HOST: 'database\nMALICIOUS=true',
      'BAD\nKEY': 'value',
      DB_PASSWORD: 'space # quote "',
    })
    expect(result).toBe('DB_HOST=databaseMALICIOUS=true\nDB_PASSWORD="space # quote \\""\n')
    expect(result).not.toContain('\r')
  })

  test('strips CRLF injection from values so a second key is never emitted', () => {
    const result = service.serializeEnv({
      SMTP_USER: 'u\r\nSMTP_PASS=pwned',
    })
    const lines = result.split('\n').filter(Boolean)
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe('SMTP_USER=uSMTP_PASS=pwned')
    expect(lines.some((l) => l.trim() === 'SMTP_PASS=pwned')).toBe(false)
  })

  test('drops keys that are not valid env identifiers (no standalone injected lines)', () => {
    const result = service.serializeEnv({
      'A\nB': 'x',
      '1BAD': 'nope',
      VALID_KEY: 'ok',
    })
    const lines = result.split('\n').filter(Boolean)
    expect(lines).toEqual(['VALID_KEY=ok'])
  })
})
