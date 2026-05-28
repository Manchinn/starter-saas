const { ok, created, fail, serverError } = require('../../core/response')
const authService = require('./auth.service')

// Pull device fingerprint off the request so refresh-token rows can be labelled.
function reqMeta(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || req.connection?.remoteAddress || null
  return { userAgent: req.get('user-agent') || null, ip }
}

module.exports = {
  async register(req, res) {
    try {
      const { user, permissions, accessToken, refreshToken } = await authService.register(req.body, reqMeta(req))
      return created(res, { user, permissions, accessToken, refreshToken }, 'Registration successful')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async login(req, res) {
    try {
      const { user, permissions, accessToken, refreshToken } = await authService.login(req.body, reqMeta(req))
      return ok(res, { user, permissions, accessToken, refreshToken }, 'Login successful')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) return fail(res, 'Refresh token required', 400)
      const tokens = await authService.refresh(refreshToken, reqMeta(req))
      return ok(res, tokens, 'Token refreshed')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async logout(req, res) {
    try {
      const { refreshToken } = req.body
      if (refreshToken) await authService.logout(refreshToken)
      return ok(res, null, 'Logged out successfully')
    } catch (err) {
      return serverError(res)
    }
  },

  async me(req, res) {
    try {
      const { user, permissions } = await authService.getMe(req.user.id)
      return ok(res, { user, permissions })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async changePassword(req, res) {
    try {
      const currentRefreshToken = req.get('x-refresh-token') || req.body?.refreshToken || null
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
      return created(res, { user, permissions, accessToken, refreshToken }, 'Installation complete')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async loginAs(req, res) {
    try {
      if (req.user.role !== 'admin') return fail(res, 'Admin access required', 403)
      const { user, permissions, accessToken, refreshToken } = await authService.loginAs(req.params.userId, reqMeta(req))
      return ok(res, { user, permissions, accessToken, refreshToken }, 'Session switched')
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
