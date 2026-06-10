// Unit tests for middleware/sanitize-query — clamps pagination query params so
// a hostile `limit`/`page` can't reach the DB as an oversized LIMIT or a
// negative OFFSET.

const sanitizeQuery = require('../sanitize-query')
const { MAX_LIMIT, MAX_PAGE } = sanitizeQuery

const run = (query) => {
  const req = { query }
  const next = jest.fn()
  sanitizeQuery(req, {}, next)
  return { req, next }
}

describe('middleware.sanitize-query', () => {
  test('always calls next()', () => {
    const { next } = run({})
    expect(next).toHaveBeenCalledTimes(1)
  })

  test('caps an oversized limit to MAX_LIMIT', () => {
    const { req } = run({ limit: '99999999' })
    expect(req.query.limit).toBe(String(MAX_LIMIT))
  })

  test('keeps an in-range limit untouched (as a string)', () => {
    const { req } = run({ limit: '25' })
    expect(req.query.limit).toBe('25')
  })

  test('drops a non-positive limit so the controller default applies', () => {
    expect(run({ limit: '0' }).req.query).not.toHaveProperty('limit')
    expect(run({ limit: '-5' }).req.query).not.toHaveProperty('limit')
  })

  test('drops a non-numeric limit', () => {
    expect(run({ limit: 'abc' }).req.query).not.toHaveProperty('limit')
  })

  test('floors page at 1 for zero/negative values', () => {
    expect(run({ page: '0' }).req.query).not.toHaveProperty('page')
    expect(run({ page: '-3' }).req.query).not.toHaveProperty('page')
  })

  test('caps an absurd page to MAX_PAGE (bounds the OFFSET)', () => {
    const { req } = run({ page: '999999999999' })
    expect(req.query.page).toBe(String(MAX_PAGE))
  })

  test('uses the last value when a param is repeated (array)', () => {
    const { req } = run({ limit: ['10', '88'] })
    expect(req.query.limit).toBe('88')
  })

  test('leaves unrelated query params intact', () => {
    const { req } = run({ search: 'acme', status: 'active', limit: '500' })
    expect(req.query.search).toBe('acme')
    expect(req.query.status).toBe('active')
    expect(req.query.limit).toBe(String(MAX_LIMIT))
  })

  test('truncates fractional values toward an integer', () => {
    const { req } = run({ limit: '12.9' })
    expect(req.query.limit).toBe('12')
  })
})
