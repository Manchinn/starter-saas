// Unit tests for core/response — the standard {success,message,data} envelope
// helpers. res is a stub whose status/json/end chain like Express's.

const res = require('../response')

const makeRes = () => {
  const r = {}
  r.status = jest.fn(() => r)
  r.json   = jest.fn(() => r)
  r.end    = jest.fn(() => r)
  return r
}

describe('response.ok', () => {
  test('defaults to 200 with success envelope and null data', () => {
    const r = makeRes()
    res.ok(r)
    expect(r.status).toHaveBeenCalledWith(200)
    expect(r.json).toHaveBeenCalledWith({ success: true, message: 'Success', data: null })
  })

  test('passes through data, message and status code', () => {
    const r = makeRes()
    res.ok(r, { id: 1 }, 'Fetched', 202)
    expect(r.status).toHaveBeenCalledWith(202)
    expect(r.json).toHaveBeenCalledWith({ success: true, message: 'Fetched', data: { id: 1 } })
  })
})

describe('response.created', () => {
  test('is a 201 with "Created" default message', () => {
    const r = makeRes()
    res.created(r, { id: 9 })
    expect(r.status).toHaveBeenCalledWith(201)
    expect(r.json).toHaveBeenCalledWith({ success: true, message: 'Created', data: { id: 9 } })
  })
})

describe('response.fail', () => {
  test('defaults to 400 and omits the errors key when none supplied', () => {
    const r = makeRes()
    res.fail(r)
    expect(r.status).toHaveBeenCalledWith(400)
    expect(r.json).toHaveBeenCalledWith({ success: false, message: 'An error occurred' })
  })

  test('includes the errors key only when provided', () => {
    const r = makeRes()
    res.fail(r, 'Bad', 422, [{ field: 'email' }])
    expect(r.status).toHaveBeenCalledWith(422)
    expect(r.json).toHaveBeenCalledWith({ success: false, message: 'Bad', errors: [{ field: 'email' }] })
  })
})

describe('response status-code shortcuts', () => {
  test.each([
    ['notFound',     404, 'Not found'],
    ['unauthorized', 401, 'Unauthorized'],
    ['forbidden',    403, 'Forbidden'],
    ['serverError',  500, 'Internal server error'],
  ])('%s → %i with default message', (fn, code, message) => {
    const r = makeRes()
    res[fn](r)
    expect(r.status).toHaveBeenCalledWith(code)
    expect(r.json).toHaveBeenCalledWith({ success: false, message })
  })

  test('noContent → 204 with end(), no json body', () => {
    const r = makeRes()
    res.noContent(r)
    expect(r.status).toHaveBeenCalledWith(204)
    expect(r.end).toHaveBeenCalled()
    expect(r.json).not.toHaveBeenCalled()
  })
})
