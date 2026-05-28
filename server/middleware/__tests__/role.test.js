// Unit tests for middleware/role.requireRole — a synchronous guard keyed on
// req.user.role. 401 when unauthenticated, 403 when the role isn't allowed.

const { requireRole } = require('../role')

const makeRes = () => {
  const r = {}
  r.status = jest.fn(() => r)
  r.json   = jest.fn(() => r)
  return r
}

describe('middleware.requireRole', () => {
  test('401 when there is no authenticated user', () => {
    const res = makeRes()
    const next = jest.fn()
    requireRole('admin')({}, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  test('403 when the user role is not in the allowed list', () => {
    const res = makeRes()
    const next = jest.fn()
    requireRole('admin', 'manager')({ user: { role: 'user' } }, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  test('calls next() when the user role matches one of the allowed roles', () => {
    const res = makeRes()
    const next = jest.fn()
    requireRole('admin', 'manager')({ user: { role: 'manager' } }, res, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
