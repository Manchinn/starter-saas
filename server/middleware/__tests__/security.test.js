const { sanitizePagination, apiRateLimit, writeRateLimit } = require('../security')

const sanitize = (query) => {
  const req = { query: { ...query } }
  const next = jest.fn()
  sanitizePagination(req, {}, next)
  return { query: req.query, next }
}

describe('sanitizePagination', () => {
  test('caps limit and page to bounded positive integers', () => {
    expect(sanitize({ page: '9999999', limit: '1000' }).query).toEqual({ page: '1000000', limit: '100' })
    expect(sanitize({ page: '-5', limit: '0' }).query).toEqual({ page: '1', limit: '1' })
  })

  test('normalizes malformed values without changing unrelated query fields', () => {
    const out = sanitize({ page: 'nope', limit: 'NaN', search: 'widget' })
    expect(out.query).toEqual({ page: '1', limit: '20', search: 'widget' })
    expect(out.next).toHaveBeenCalledTimes(1)
  })
})

describe('rate limit middleware', () => {
  test('exports separate general and write limiters', () => {
    expect(typeof apiRateLimit).toBe('function')
    expect(typeof writeRateLimit).toBe('function')
    expect(apiRateLimit).not.toBe(writeRateLimit)
  })
})
