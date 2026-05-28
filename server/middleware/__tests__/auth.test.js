// Unit tests for middleware/auth.authenticate.
//
// Verifies the Bearer-token gate: header shape, jwt.verify outcomes (valid /
// expired / invalid), and the active-account lookup. jwt + User + config are
// all mocked so no real signing or DB access happens.

jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }))
jest.mock('../../models', () => ({ User: { findByPk: jest.fn() } }))
jest.mock('../../config/config', () => ({ jwt: { secret: 'test-secret' } }))

const jwt = require('jsonwebtoken')
const { User } = require('../../models')
const { authenticate } = require('../auth')

const makeRes = () => {
  const r = {}
  r.status = jest.fn(() => r)
  r.json   = jest.fn(() => r)
  return r
}

describe('middleware.authenticate', () => {
  test('401 when the Authorization header is absent', async () => {
    const res = makeRes()
    const next = jest.fn()
    await authenticate({ headers: {} }, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access token required' })
    expect(next).not.toHaveBeenCalled()
  })

  test('401 when the header is not a Bearer token', async () => {
    const res = makeRes()
    await authenticate({ headers: { authorization: 'Basic abc' } }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(401)
  })

  test('attaches the user and calls next() for a valid token + active account', async () => {
    jwt.verify.mockReturnValue({ id: 'u1' })
    const user = { id: 'u1', isActive: true }
    User.findByPk.mockResolvedValue(user)
    const req = { headers: { authorization: 'Bearer good.token' } }
    const next = jest.fn()
    await authenticate(req, makeRes(), next)
    expect(jwt.verify).toHaveBeenCalledWith('good.token', 'test-secret')
    expect(req.user).toBe(user)
    expect(next).toHaveBeenCalled()
  })

  test('401 when the account is missing or inactive', async () => {
    jwt.verify.mockReturnValue({ id: 'u1' })
    User.findByPk.mockResolvedValue({ id: 'u1', isActive: false })
    const res = makeRes()
    await authenticate({ headers: { authorization: 'Bearer t' } }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid or inactive account' })
  })

  test('401 with TOKEN_EXPIRED code when the token is expired', async () => {
    jwt.verify.mockImplementation(() => { throw Object.assign(new Error('expired'), { name: 'TokenExpiredError' }) })
    const res = makeRes()
    await authenticate({ headers: { authorization: 'Bearer old' } }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access token expired', code: 'TOKEN_EXPIRED' })
  })

  test('401 "Invalid access token" for any other verify failure', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('malformed') })
    const res = makeRes()
    await authenticate({ headers: { authorization: 'Bearer bad' } }, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid access token' })
  })
})
