// Security unit tests for modules/auth/auth.cookies.
//
// The refresh token's safety rests entirely on the cookie attributes set here:
// httpOnly (JS can't read it), SameSite=Strict (no cross-site CSRF send),
// Secure (no plaintext leak in prod), and Path=/api (not sent app-wide). These
// tests pin those attributes so a future refactor can't silently weaken them.
// They also exercise the hand-rolled cookie-header parser for the edge cases an
// attacker controls (substring names, malformed pairs, URL-encoding).

jest.mock('../../../config/config', () => ({
  jwt: { refreshExpiresIn: '7d' },
  cookieSecure: 'auto',
}))

const config = require('../../../config/config')
const cookies = require('../auth.cookies')

// A res stub that records the last cookie()/clearCookie() call.
const makeRes = () => {
  const r = { cookieCalls: [], clearCalls: [] }
  r.cookie = jest.fn((name, value, opts) => r.cookieCalls.push({ name, value, opts }))
  r.clearCookie = jest.fn((name, opts) => r.clearCalls.push({ name, opts }))
  return r
}

beforeEach(() => {
  config.jwt.refreshExpiresIn = '7d'
  config.cookieSecure = 'auto'
})

describe('auth.cookies — refresh cookie security attributes', () => {
  test('refresh cookie is httpOnly, SameSite=Strict and scoped to /api', () => {
    const res = makeRes()
    cookies.setRefreshCookie({ headers: {} }, res, 'tok')
    const { name, value, opts } = res.cookieCalls[0]
    expect(name).toBe('refreshToken')
    expect(value).toBe('tok')
    expect(opts.httpOnly).toBe(true)
    expect(opts.sameSite).toBe('strict')
    expect(opts.path).toBe('/api')
  })

  test('persist=true sets a maxAge (durable cookie)', () => {
    const res = makeRes()
    cookies.setRefreshCookie({ headers: {} }, res, 'tok', { persist: true })
    expect(res.cookieCalls[0].opts.maxAge).toBe(7 * 24 * 60 * 60 * 1000)
  })

  test('persist=false omits maxAge (session cookie cleared on browser close)', () => {
    const res = makeRes()
    cookies.setRefreshCookie({ headers: {} }, res, 'tok', { persist: false })
    expect(res.cookieCalls[0].opts).not.toHaveProperty('maxAge')
  })

  test('clearRefreshCookie clears with the same scoping attributes', () => {
    const res = makeRes()
    cookies.clearRefreshCookie({ headers: {} }, res)
    const { name, opts } = res.clearCalls[0]
    expect(name).toBe('refreshToken')
    expect(opts).toMatchObject({ httpOnly: true, sameSite: 'strict', path: '/api' })
  })

  test('impersonator cookie carries the same hardening and is always persistent', () => {
    const res = makeRes()
    cookies.setImpersonatorCookie({ headers: {} }, res, 'admin-tok')
    const { name, opts } = res.cookieCalls[0]
    expect(name).toBe('impersonatorRefreshToken')
    expect(opts).toMatchObject({ httpOnly: true, sameSite: 'strict', path: '/api' })
    expect(opts.maxAge).toBeGreaterThan(0)
  })
})

describe('auth.cookies — Secure flag', () => {
  test('cookieSecure="true" forces Secure even over plain http', () => {
    config.cookieSecure = 'true'
    const res = makeRes()
    cookies.setRefreshCookie({ headers: {}, secure: false }, res, 'tok')
    expect(res.cookieCalls[0].opts.secure).toBe(true)
  })

  test('cookieSecure="false" disables Secure even over https', () => {
    config.cookieSecure = 'false'
    const res = makeRes()
    cookies.setRefreshCookie({ headers: {}, secure: true }, res, 'tok')
    expect(res.cookieCalls[0].opts.secure).toBe(false)
  })

  test('auto: Secure when the request is https', () => {
    const res = makeRes()
    cookies.setRefreshCookie({ headers: {}, secure: true }, res, 'tok')
    expect(res.cookieCalls[0].opts.secure).toBe(true)
  })

  test('auto: Secure when terminated TLS proxy sets x-forwarded-proto=https', () => {
    const res = makeRes()
    cookies.setRefreshCookie({ headers: { 'x-forwarded-proto': 'https' } }, res, 'tok')
    expect(res.cookieCalls[0].opts.secure).toBe(true)
  })

  test('auto: not Secure over plain http', () => {
    const res = makeRes()
    cookies.setRefreshCookie({ headers: {}, secure: false }, res, 'tok')
    expect(res.cookieCalls[0].opts.secure).toBe(false)
  })
})

describe('auth.cookies — readCookie parser', () => {
  test('returns the value for a present cookie', () => {
    const req = { headers: { cookie: 'refreshToken=abc123' } }
    expect(cookies.readCookie(req, 'refreshToken')).toBe('abc123')
  })

  test('returns "" when the cookie header is absent', () => {
    expect(cookies.readCookie({ headers: {} }, 'refreshToken')).toBe('')
  })

  test('picks the right cookie out of several', () => {
    const req = { headers: { cookie: 'a=1; refreshToken=tok; impersonatorRefreshToken=imp' } }
    expect(cookies.readCookie(req, 'refreshToken')).toBe('tok')
    expect(cookies.readCookie(req, 'impersonatorRefreshToken')).toBe('imp')
  })

  test('URL-decodes the stored value', () => {
    const req = { headers: { cookie: 'refreshToken=a%20b%3Dc' } }
    expect(cookies.readCookie(req, 'refreshToken')).toBe('a b=c')
  })

  test('does not match a cookie whose name is a substring of the requested one', () => {
    // Requesting "refreshToken" must not return "myrefreshToken"'s value.
    const req = { headers: { cookie: 'myrefreshToken=evil' } }
    expect(cookies.readCookie(req, 'refreshToken')).toBe('')
  })

  test('ignores malformed segments with no "="', () => {
    const req = { headers: { cookie: 'garbage; refreshToken=ok' } }
    expect(cookies.readCookie(req, 'refreshToken')).toBe('ok')
  })

  test('handles a value that itself contains "="', () => {
    const req = { headers: { cookie: 'refreshToken=a=b=c' } }
    expect(cookies.readCookie(req, 'refreshToken')).toBe('a=b=c')
  })
})

describe('auth.cookies — refresh max-age parsing', () => {
  const maxAgeFor = (ttl) => {
    config.jwt.refreshExpiresIn = ttl
    const res = makeRes()
    cookies.setRefreshCookie({ headers: {} }, res, 'tok', { persist: true })
    return res.cookieCalls[0].opts.maxAge
  }

  test('days', () => expect(maxAgeFor('7d')).toBe(7 * 86400 * 1000))
  test('hours', () => expect(maxAgeFor('12h')).toBe(12 * 3600 * 1000))
  test('minutes', () => expect(maxAgeFor('30m')).toBe(30 * 60 * 1000))
  test('bare seconds', () => expect(maxAgeFor('3600')).toBe(3600 * 1000))
  test('falls back to 7 days on an unparseable TTL', () =>
    expect(maxAgeFor('not-a-ttl')).toBe(7 * 86400 * 1000))
})
