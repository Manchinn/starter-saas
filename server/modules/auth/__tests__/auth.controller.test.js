// Security unit tests for modules/auth/auth.controller.
//
// The controller is the trust boundary between HTTP and the auth service. Its
// security-critical jobs: (1) never put the refresh token in the response body
// — it belongs only in the httpOnly cookie; (2) gate impersonation on an admin
// caller; (3) clear the refresh cookie when a refresh is rejected so a stale
// token isn't retried; (4) tear down BOTH the impersonated and parked sessions
// on logout/return. The service and cookie helpers are mocked; the real
// response helpers run so we assert on actual status codes and JSON shape.

jest.mock('../auth.service')
jest.mock('../auth.cookies', () => ({
  REFRESH_COOKIE: 'refreshToken',
  IMPERSONATOR_COOKIE: 'impersonatorRefreshToken',
  readCookie: jest.fn(),
  setRefreshCookie: jest.fn(),
  clearRefreshCookie: jest.fn(),
  setImpersonatorCookie: jest.fn(),
  clearImpersonatorCookie: jest.fn(),
}))

const authService = require('../auth.service')
const cookieHelpers = require('../auth.cookies')
const controller = require('../auth.controller')

const makeRes = () => {
  const r = { statusCode: null, body: null }
  r.status = jest.fn((c) => { r.statusCode = c; return r })
  r.json = jest.fn((b) => { r.body = b; return r })
  r.cookie = jest.fn()
  r.clearCookie = jest.fn()
  return r
}

const makeReq = (over = {}) => ({
  headers: {},
  body: {},
  params: {},
  get: jest.fn(() => null),
  ...over,
})

const session = {
  user: { id: 'u1', role: 'user' },
  permissions: [],
  accessToken: 'access-tok',
  refreshToken: 'refresh-tok',
}

describe('auth.controller.login — token leakage', () => {
  test('sets the refresh token as a cookie, never in the JSON body', async () => {
    authService.login.mockResolvedValue(session)
    const res = makeRes()
    await controller.login(makeReq({ body: { email: 'e', password: 'p' } }), res)

    expect(cookieHelpers.setRefreshCookie).toHaveBeenCalledWith(
      expect.anything(), res, 'refresh-tok', expect.any(Object),
    )
    expect(res.statusCode).toBe(200)
    expect(res.body.data).not.toHaveProperty('refreshToken')
    expect(res.body.data.accessToken).toBe('access-tok')
  })

  test('maps a service 401 to a 401 response', async () => {
    authService.login.mockRejectedValue({ status: 401, message: 'Invalid credentials' })
    const res = makeRes()
    await controller.login(makeReq(), res)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ success: false, message: 'Invalid credentials' })
  })
})

describe('auth.controller.register / install — token leakage', () => {
  test('register never returns the refresh token in the body', async () => {
    authService.register.mockResolvedValue(session)
    const res = makeRes()
    await controller.register(makeReq(), res)
    expect(res.statusCode).toBe(201)
    expect(res.body.data).not.toHaveProperty('refreshToken')
    expect(cookieHelpers.setRefreshCookie).toHaveBeenCalled()
  })

  test('install never returns the refresh token in the body', async () => {
    authService.install.mockResolvedValue(session)
    const res = makeRes()
    await controller.install(makeReq(), res)
    expect(res.statusCode).toBe(201)
    expect(res.body.data).not.toHaveProperty('refreshToken')
  })
})

describe('auth.controller.refresh', () => {
  test('401 when no refresh cookie is present', async () => {
    cookieHelpers.readCookie.mockReturnValue('')
    const res = makeRes()
    await controller.refresh(makeReq(), res)
    expect(res.statusCode).toBe(401)
    expect(authService.refresh).not.toHaveBeenCalled()
  })

  test('rotates the cookie and returns only the access token on success', async () => {
    cookieHelpers.readCookie.mockReturnValue('old-refresh')
    authService.refresh.mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' })
    const res = makeRes()
    await controller.refresh(makeReq(), res)
    expect(cookieHelpers.setRefreshCookie).toHaveBeenCalledWith(
      expect.anything(), res, 'new-refresh', { persist: true },
    )
    expect(res.body.data).toEqual({ accessToken: 'new-access' })
  })

  test('clears the refresh cookie when the token is rejected (no retry of a dead token)', async () => {
    cookieHelpers.readCookie.mockReturnValue('bad-refresh')
    authService.refresh.mockRejectedValue({ status: 401, message: 'Invalid or expired refresh token' })
    const res = makeRes()
    await controller.refresh(makeReq(), res)
    expect(cookieHelpers.clearRefreshCookie).toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
  })
})

describe('auth.controller.loginAs — impersonation admin gate', () => {
  test('403 and no service call when the caller is not an admin', async () => {
    const res = makeRes()
    await controller.loginAs(makeReq({ user: { id: 'u1', role: 'user' }, params: { userId: 't' } }), res)
    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual({ success: false, message: 'Admin access required' })
    expect(authService.loginAs).not.toHaveBeenCalled()
    expect(cookieHelpers.setImpersonatorCookie).not.toHaveBeenCalled()
  })

  test('admin: parks own token and switches into the target session', async () => {
    cookieHelpers.readCookie.mockReturnValue('admin-refresh')
    authService.loginAs.mockResolvedValue(session)
    const res = makeRes()
    await controller.loginAs(makeReq({ user: { id: 'a1', role: 'admin' }, params: { userId: 't' } }), res)

    expect(cookieHelpers.setImpersonatorCookie).toHaveBeenCalledWith(expect.anything(), res, 'admin-refresh')
    expect(cookieHelpers.setRefreshCookie).toHaveBeenCalledWith(expect.anything(), res, 'refresh-tok', { persist: true })
    expect(res.body.data).toMatchObject({ impersonating: true })
    expect(res.body.data).not.toHaveProperty('refreshToken')
  })
})

describe('auth.controller.returnToAdmin', () => {
  test('400 when there is no parked impersonator cookie', async () => {
    cookieHelpers.readCookie.mockReturnValue('')
    const res = makeRes()
    await controller.returnToAdmin(makeReq(), res)
    expect(res.statusCode).toBe(400)
    expect(authService.returnToAdmin).not.toHaveBeenCalled()
  })

  test('revokes the abandoned impersonated session and restores the admin', async () => {
    // First read → impersonator cookie, second read → impersonated refresh cookie.
    cookieHelpers.readCookie
      .mockReturnValueOnce('parked-admin')
      .mockReturnValueOnce('impersonated-refresh')
    authService.logout.mockResolvedValue()
    authService.returnToAdmin.mockResolvedValue({ ...session, user: { id: 'a1', role: 'admin' } })
    const res = makeRes()
    await controller.returnToAdmin(makeReq(), res)

    expect(authService.logout).toHaveBeenCalledWith('impersonated-refresh')
    expect(authService.returnToAdmin).toHaveBeenCalledWith('parked-admin', expect.any(Object))
    expect(cookieHelpers.clearImpersonatorCookie).toHaveBeenCalled()
    expect(res.body.data).toMatchObject({ impersonating: false })
    expect(res.body.data).not.toHaveProperty('refreshToken')
  })
})

describe('auth.controller.logout', () => {
  test('revokes both the active and parked tokens and clears both cookies', async () => {
    cookieHelpers.readCookie
      .mockReturnValueOnce('active-refresh')   // REFRESH_COOKIE
      .mockReturnValueOnce('parked-admin')     // IMPERSONATOR_COOKIE
    authService.logout.mockResolvedValue()
    const res = makeRes()
    await controller.logout(makeReq(), res)

    expect(authService.logout).toHaveBeenCalledWith('active-refresh')
    expect(authService.logout).toHaveBeenCalledWith('parked-admin')
    expect(cookieHelpers.clearRefreshCookie).toHaveBeenCalled()
    expect(cookieHelpers.clearImpersonatorCookie).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })

  test('still clears cookies when there is no token to revoke', async () => {
    cookieHelpers.readCookie.mockReturnValue('')
    const res = makeRes()
    await controller.logout(makeReq(), res)
    expect(authService.logout).not.toHaveBeenCalled()
    expect(cookieHelpers.clearRefreshCookie).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })
})

describe('auth.controller.me — impersonation flag', () => {
  test('reports impersonating=true when the parked cookie is present', async () => {
    authService.getMe.mockResolvedValue({ user: { id: 'u1' }, permissions: [] })
    cookieHelpers.readCookie.mockReturnValue('parked-admin')
    const res = makeRes()
    await controller.me(makeReq({ user: { id: 'u1' } }), res)
    expect(res.body.data.impersonating).toBe(true)
  })

  test('reports impersonating=false with no parked cookie', async () => {
    authService.getMe.mockResolvedValue({ user: { id: 'u1' }, permissions: [] })
    cookieHelpers.readCookie.mockReturnValue('')
    const res = makeRes()
    await controller.me(makeReq({ user: { id: 'u1' } }), res)
    expect(res.body.data.impersonating).toBe(false)
  })
})

describe('auth.controller — enumeration-safe responses', () => {
  test('forgotPassword always returns a generic success message', async () => {
    authService.forgotPassword.mockResolvedValue()
    const res = makeRes()
    await controller.forgotPassword(makeReq({ body: { email: 'whoever@x.com' } }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/if that email is registered/i)
  })

  test('resendVerification always returns a generic success message', async () => {
    authService.resendVerification.mockResolvedValue()
    const res = makeRes()
    await controller.resendVerification(makeReq({ body: { email: 'whoever@x.com' } }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.message).toMatch(/if that account is unverified/i)
  })
})
