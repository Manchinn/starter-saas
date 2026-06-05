// Unit tests for modules/settings.service — the Email Setting tab backend.
// The .env writer and the mailer are mocked so nothing touches the real file
// system or network; we assert the env mapping, password-preserve behaviour,
// and that the mailer is reset after a save.

jest.mock('../../../core/env-file', () => ({ updateEnv: jest.fn() }))
jest.mock('../../../core/mailer', () => ({
  reset: jest.fn(),
  verify: jest.fn(),
  send: jest.fn(),
  isStub: jest.fn(() => false),
}))

const { updateEnv } = require('../../../core/env-file')
const mailer = require('../../../core/mailer')
const service = require('../settings.service')

const SMTP_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
function clearSmtpEnv() { for (const k of SMTP_KEYS) delete process.env[k] }

beforeEach(() => {
  jest.clearAllMocks()
  clearSmtpEnv()
})

describe('getEmailSettings', () => {
  test('never returns the password, only a hasPassword flag', () => {
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_PASS = 'super-secret'
    const out = service.getEmailSettings()
    expect(out).not.toHaveProperty('pass')
    expect(out.hasPassword).toBe(true)
    expect(out.configured).toBe(true)
    expect(out.host).toBe('smtp.example.com')
  })

  test('configured=false and hasPassword=false when unset', () => {
    const out = service.getEmailSettings()
    expect(out.configured).toBe(false)
    expect(out.hasPassword).toBe(false)
  })
})

describe('updateEmailSettings', () => {
  test('maps fields to env, sets process.env, and resets the mailer', () => {
    service.updateEmailSettings({ host: ' smtp.x.io ', port: 465, secure: true, user: 'u', from: 'no-reply@x.io', pass: 'pw' })
    const written = updateEnv.mock.calls[0][0]
    expect(written).toMatchObject({
      SMTP_HOST: 'smtp.x.io',
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
      SMTP_USER: 'u',
      SMTP_FROM: 'no-reply@x.io',
      SMTP_PASS: 'pw',
    })
    expect(process.env.SMTP_HOST).toBe('smtp.x.io')
    expect(process.env.SMTP_SECURE).toBe('true')
    expect(mailer.reset).toHaveBeenCalledTimes(1)
  })

  test('omits SMTP_PASS when no new password is supplied (keeps existing)', () => {
    service.updateEmailSettings({ host: 'h', port: 587, secure: false, user: 'u', from: 'a@b.co' })
    const written = updateEnv.mock.calls[0][0]
    expect(written).not.toHaveProperty('SMTP_PASS')
    expect(written.SMTP_SECURE).toBe('false')
  })

  test('allows clearing the host (stub mode)', () => {
    const out = service.updateEmailSettings({ host: '', port: 587, secure: false, from: 'a@b.co' })
    expect(updateEnv.mock.calls[0][0].SMTP_HOST).toBe('')
    expect(out.configured).toBe(false)
  })
})

describe('testConnection', () => {
  test('delegates to mailer.verify', async () => {
    mailer.verify.mockResolvedValue({ configured: true, message: 'ok' })
    await expect(service.testConnection()).resolves.toEqual({ configured: true, message: 'ok' })
  })

  test('wraps a verify failure as a 400', async () => {
    mailer.verify.mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(service.testConnection()).rejects.toMatchObject({ status: 400, message: expect.stringContaining('ECONNREFUSED') })
  })
})

describe('sendTestEmail', () => {
  test('sends and returns the messageId', async () => {
    mailer.isStub.mockReturnValue(false)
    mailer.send.mockResolvedValue({ messageId: 'abc123' })
    const out = await service.sendTestEmail('to@x.io')
    expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'to@x.io' }))
    expect(out.messageId).toBe('abc123')
    expect(out.stub).toBe(false)
  })

  test('reports stub mode when SMTP is unconfigured', async () => {
    mailer.isStub.mockReturnValue(true)
    mailer.send.mockResolvedValue({ messageId: 'stub-1' })
    const out = await service.sendTestEmail('to@x.io')
    expect(out.stub).toBe(true)
    expect(out.message).toMatch(/stub mode/i)
  })

  test('wraps a send failure as a 400', async () => {
    mailer.send.mockRejectedValue(new Error('boom'))
    await expect(service.sendTestEmail('to@x.io')).rejects.toMatchObject({ status: 400 })
  })
})
