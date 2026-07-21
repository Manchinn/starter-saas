describe('LINE credential encryption', () => {
  beforeEach(() => {
    process.env.LINE_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64')
    jest.resetModules()
  })

  test('round-trips a credential without storing plaintext', () => {
    const crypto = require('../services/line.crypto')
    const encrypted = crypto.encrypt('line-access-token')
    expect(encrypted).not.toContain('line-access-token')
    expect(crypto.decrypt(encrypted)).toBe('line-access-token')
  })
})
