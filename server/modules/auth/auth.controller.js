const { ok, created, fail, serverError } = require('../../core/response')
const authService = require('./auth.service')
const {
  REFRESH_COOKIE,
  IMPERSONATOR_COOKIE,
  readCookie,
  setRefreshCookie,
  clearRefreshCookie,
  setImpersonatorCookie,
  clearImpersonatorCookie,
} = require('./auth.cookies')

// Pull device fingerprint off the request so refresh-token rows can be labelled.
function reqMeta(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || req.connection?.remoteAddress || null
  return { userAgent: req.get('user-agent') || null, ip }
}

// "Remember me" → persistent cookie; otherwise a session cookie. Defaults to
// persistent so existing callers (register/install) keep long-lived sessions.
function wantsPersist(req) {
  return req.body?.remember !== false
}

module.exports = {
  async register(req, res) {
    try {
      const { user, permissions, accessToken, refreshToken } = await authService.register(req.body, reqMeta(req))
      setRefreshCookie(res, refreshToken, { persist: wantsPersist(req) })
      return created(res, { user, permissions, accessToken }, 'Registration successful')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async login(req, res) {
    try {
      const { user, permissions, accessToken, refreshToken } = await authService.login(req.body, reqMeta(req))
      setRefreshCookie(res, refreshToken, { persist: wantsPersist(req) })
      return ok(res, { user, permissions, accessToken }, 'Login successful')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async refresh(req, res) {
    try {
      const refreshToken = readCookie(req, REFRESH_COOKIE)
      if (!refreshToken) return fail(res, 'Refresh token required', 401)
      const tokens = await authService.refresh(refreshToken, reqMeta(req))
      // Rotate the cookie; keep it persistent (a silent refresh has no "remember" signal).
      setRefreshCookie(res, tokens.refreshToken, { persist: true })
      return ok(res, { accessToken: tokens.accessToken }, 'Token refreshed')
    } catch (err) {
      // A bad/expired refresh token is unrecoverable — clear it so the client
      // stops retrying and falls back to the login screen.
      if ((err.status || 0) === 401) clearRefreshCookie(res)
      return fail(res, err.message, err.status || 401)
    }
  },

  async logout(req, res) {
    try {
      const refreshToken = readCookie(req, REFRESH_COOKIE)
      if (refreshToken) await authService.logout(refreshToken)
      // If logging out mid-impersonation, drop the parked admin token too.
      const impersonator = readCookie(req, IMPERSONATOR_COOKIE)
      if (impersonator) await authService.logout(impersonator)
      clearRefreshCookie(res)
      clearImpersonatorCookie(res)
      return ok(res, null, 'Logged out successfully')
    } catch (err) {
      return serverError(res)
    }
  },

  async me(req, res) {
    try {
      const { user, permissions } = await authService.getMe(req.user.id)
      const impersonating = !!readCookie(req, IMPERSONATOR_COOKIE)
      return ok(res, { user, permissions, impersonating })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async changePassword(req, res) {
    try {
      // Preserve the caller's current session (identified by the cookie token)
      // while revoking every other session.
      const currentRefreshToken = readCookie(req, REFRESH_COOKIE) || null
      await authService.changePassword(req.user.id, req.body, currentRefreshToken)
      return ok(res, null, 'Password changed successfully')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async installStatus(req, res) {
    try {
      const status = await authService.getInstallStatus()
      return ok(res, status)
    } catch (err) {
      return serverError(res)
    }
  },

  async install(req, res) {
    try {
      const { user, permissions, accessToken, refreshToken } = await authService.install(req.body, reqMeta(req))
      setRefreshCookie(res, refreshToken, { persist: wantsPersist(req) })
      return created(res, { user, permissions, accessToken }, 'Installation complete')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async loginAs(req, res) {
    try {
      if (req.user.role !== 'admin') return fail(res, 'Admin access required', 403)
      // Park the admin's own refresh token (still valid) so we can return later.
      const adminRefresh = readCookie(req, REFRESH_COOKIE)
      const { user, permissions, accessToken, refreshToken } = await authService.loginAs(req.params.userId, reqMeta(req))
      if (adminRefresh) setImpersonatorCookie(res, adminRefresh)
      setRefreshCookie(res, refreshToken, { persist: true })
      return ok(res, { user, permissions, accessToken, impersonating: true }, 'Session switched')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  // Restore the admin session parked by loginAs — purely from httpOnly cookies,
  // so no privileged token is ever exposed to client JS.
  async returnToAdmin(req, res) {
    try {
      const impersonator = readCookie(req, IMPERSONATOR_COOKIE)
      if (!impersonator) return fail(res, 'No impersonation session to return from', 400)
      // Revoke the impersonated user's session we're abandoning.
      const impersonated = readCookie(req, REFRESH_COOKIE)
      if (impersonated) await authService.logout(impersonated)
      // Rotate the parked admin token forward and resolve the admin session.
      const { user, permissions, accessToken, refreshToken } = await authService.returnToAdmin(impersonator, reqMeta(req))
      setRefreshCookie(res, refreshToken, { persist: true })
      clearImpersonatorCookie(res)
      return ok(res, { user, permissions, accessToken, impersonating: false }, 'Returned to admin')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async forgotPassword(req, res) {
    try {
      await authService.forgotPassword(req.body.email)
      return ok(res, null, 'If that email is registered, a reset link has been sent.')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async resetPassword(req, res) {
    try {
      await authService.resetPassword({ token: req.body.token, newPassword: req.body.newPassword })
      return ok(res, null, 'Password has been reset. You can now sign in.')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async verifyEmail(req, res) {
    try {
      const result = await authService.verifyEmail(req.params.token)
      return ok(res, result, 'Email verified successfully')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async resendVerification(req, res) {
    try {
      await authService.resendVerification(req.body.email)
      return ok(res, null, 'If that account is unverified, a new verification email has been sent.')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
