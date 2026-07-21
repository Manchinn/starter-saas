const {
  sanitizePagination,
  apiRateLimit,
  writeRateLimit,
  loginLimiter,
  registerLimiter,
  emailLimiter,
  refreshLimiter,
  tokenLimiter,
  impersonationLimiter,
  MAX_LIMIT,
  MAX_PAGE,
  clampInt,
  READ_MAX,
  WRITE_MAX,
} = require('../security')

const sanitize = (query) => {
  const req = { query: { ...query } }
  const next = jest.fn()
  sanitizePagination(req, {}, next)
  return { query: req.query, next }
}

describe('clampInt', () => {
  test('caps above max and rejects below min / non-numeric', () => {
    expect(clampInt('1000', 1, 100)).toBe(100)
    expect(clampInt('0', 1, 100)).toBeNull()
    expect(clampInt('-5', 1, 100)).toBeNull()
    expect(clampInt('nope', 1, 100)).toBeNull()
    expect(clampInt(undefined, 1, 100)).toBeNull()
  })

  test('uses the last value when the param is repeated as an array', () => {
    expect(clampInt(['999', '5'], 1, 100)).toBe(5)
    expect(clampInt(['-1', '2'], 1, 1_000_000)).toBe(2)
  })
})

describe('sanitizePagination', () => {
  test('caps limit and page to bounded positive integers', () => {
    expect(sanitize({ page: '9999999', limit: '1000' }).query).toEqual({
      page: String(MAX_PAGE),
      limit: String(MAX_LIMIT),
    })
  })

  test('drops invalid page/limit so controllers keep their own defaults', () => {
    const out = sanitize({ page: 'nope', limit: 'NaN', search: 'widget' })
    expect(out.query).toEqual({ search: 'widget' })
    expect(out.next).toHaveBeenCalledTimes(1)
  })

  test('drops values below the floor (negative / zero)', () => {
    expect(sanitize({ page: '-5', limit: '0' }).query).toEqual({})
  })

  test('uses the last repeated query value', () => {
    expect(sanitize({ page: ['-1', '2'], limit: ['999', '5'] }).query).toEqual({
      page: '2',
      limit: '5',
    })
  })

  test('leaves valid in-range values as strings', () => {
    expect(sanitize({ page: '3', limit: '25' }).query).toEqual({ page: '3', limit: '25' })
  })
})

describe('rate limit middleware', () => {
  test('exports separate general and write limiters', () => {
    expect(typeof apiRateLimit).toBe('function')
    expect(typeof writeRateLimit).toBe('function')
    expect(apiRateLimit).not.toBe(writeRateLimit)
  })

  test('exports auth flow limiters used by auth.routes', () => {
    for (const fn of [
      loginLimiter,
      registerLimiter,
      emailLimiter,
      refreshLimiter,
      tokenLimiter,
      impersonationLimiter,
    ]) {
      expect(typeof fn).toBe('function')
    }
  })

  test('global budgets default to generous SPA-safe ceilings', () => {
    expect(READ_MAX).toBe(1500)
    expect(WRITE_MAX).toBe(300)
  })
})
