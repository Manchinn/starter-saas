const BaseController = require('../../core/BaseController')
const authService = require('./auth.service')

class AuthController extends BaseController {
  async register(req, res) {
    try {
      const { user, permissions, accessToken, refreshToken } = await authService.register(req.body)
      return this.created(res, { user, permissions, accessToken, refreshToken }, 'Registration successful')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async login(req, res) {
    try {
      const { user, permissions, accessToken, refreshToken } = await authService.login(req.body)
      return this.ok(res, { user, permissions, accessToken, refreshToken }, 'Login successful')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) return this.fail(res, 'Refresh token required', 400)
      const tokens = await authService.refresh(refreshToken)
      return this.ok(res, tokens, 'Token refreshed')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body
      if (refreshToken) await authService.logout(refreshToken)
      return this.ok(res, null, 'Logged out successfully')
    } catch (err) {
      return this.serverError(res)
    }
  }

  /**
   * GET /api/auth/me — returns user + their roles + resolved permission slugs.
   */
  async me(req, res) {
    try {
      const { user, permissions } = await authService.getMe(req.user.id)
      return this.ok(res, { user, permissions })
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async changePassword(req, res) {
    try {
      await authService.changePassword(req.user.id, req.body)
      return this.ok(res, null, 'Password changed successfully')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }

  async installStatus(req, res) {
    try {
      const status = await authService.getInstallStatus()
      return this.ok(res, status)
    } catch (err) {
      return this.serverError(res)
    }
  }

  async install(req, res) {
    try {
      const { user, permissions, accessToken, refreshToken } = await authService.install(req.body)
      return this.created(res, { user, permissions, accessToken, refreshToken }, 'Installation complete')
    } catch (err) {
      return this.fail(res, err.message, err.status || 400)
    }
  }
}

module.exports = new AuthController()
