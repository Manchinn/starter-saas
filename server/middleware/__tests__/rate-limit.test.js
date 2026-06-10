// Security tests for middleware/rate-limit.
//
// The limiter configs ARE the security control here: the login/register/email
// caps are the brute-force, credential-stuffing and email-bomb defences. These
// tests pin every limiter's window and max so an accidental loosening (or a
// refactor that drops a limiter) fails loudly in CI instead of silently
// shipping. express-rate-limit is mocked to capture the options each limiter
// was built with.

jest.mock('express-rate-limit', () => jest.fn((opts) => ({ __opts: opts })))

const limiters = require('../rate-limit')

const MIN_15 = 15 * 60 * 1000
const HOUR_1 = 60 * 60 * 1000

const optsOf = (limiter) => limiter.__opts

describe('rate-limit — limiter budgets are pinned', () => {
  test.each([
    // [name, windowMs, max]
    ['apiLimiter',           MIN_15, 100],
    ['writeLimiter',         MIN_15, 30],
    ['loginLimiter',         MIN_15, 10],
    ['registerLimiter',      HOUR_1, 5],
    ['emailLimiter',         HOUR_1, 5],
    ['refreshLimiter',       MIN_15, 60],
    ['tokenLimiter',         MIN_15, 20],
    ['impersonationLimiter', MIN_15, 30],
  ])('%s allows at most %i ms window / max %i', (name, windowMs, max) => {
    const opts = optsOf(limiters[name])
    expect(opts.windowMs).toBe(windowMs)
    expect(opts.max).toBe(max)
  })

  test('every limiter uses standard RateLimit headers and disables the legacy ones', () => {
    for (const limiter of Object.values(limiters)) {
      expect(optsOf(limiter)).toMatchObject({ standardHeaders: true, legacyHeaders: false })
    }
  })

  test('every limiter responds with a JSON shape, not a bare string', () => {
    for (const [name, limiter] of Object.entries(limiters)) {
      expect(optsOf(limiter).message).toEqual(
        expect.objectContaining({ success: false, message: expect.any(String) }),
      )
      // and none of the messages leak internals
      expect(optsOf(limiter).message.message).not.toMatch(/stack|sql|error:/i)
    }
  })

  test('the abuse-prone flows are strictly tighter than the blanket API ceiling', () => {
    const api = optsOf(limiters.apiLimiter)
    for (const name of ['loginLimiter', 'registerLimiter', 'emailLimiter', 'tokenLimiter', 'writeLimiter', 'impersonationLimiter']) {
      const opts = optsOf(limiters[name])
      // Same-or-longer window with a smaller budget → strictly tighter.
      expect(opts.windowMs).toBeGreaterThanOrEqual(api.windowMs)
      expect(opts.max).toBeLessThan(api.max)
    }
  })

  test('exactly the eight expected limiters are exported (none dropped, none stray)', () => {
    // (Call-count on the rateLimit mock is unusable here: jest's resetMocks
    // wipes require-time call history. The export list pins the same thing.)
    expect(Object.keys(limiters).sort()).toEqual([
      'apiLimiter', 'emailLimiter', 'impersonationLimiter', 'loginLimiter',
      'refreshLimiter', 'registerLimiter', 'tokenLimiter', 'writeLimiter',
    ])
  })
})
