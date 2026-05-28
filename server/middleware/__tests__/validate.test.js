// Unit tests for middleware/validate — turns express-validator results into a
// 422 with a {field,message} list, or passes control through when clean.

jest.mock('express-validator', () => ({ validationResult: jest.fn() }))

const { validationResult } = require('express-validator')
const { validate } = require('../validate')

const makeRes = () => {
  const r = {}
  r.status = jest.fn(() => r)
  r.json   = jest.fn(() => r)
  return r
}

describe('middleware.validate', () => {
  test('calls next() and never touches res when there are no errors', () => {
    validationResult.mockReturnValue({ isEmpty: () => true })
    const res = makeRes()
    const next = jest.fn()
    validate({}, res, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  test('returns 422 with mapped field/message errors and skips next()', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ path: 'email', msg: 'Invalid email' }, { path: 'name', msg: 'Required' }],
    })
    const res = makeRes()
    const next = jest.fn()
    validate({}, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'email', message: 'Invalid email' }, { field: 'name', message: 'Required' }],
    })
  })
})
