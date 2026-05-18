const { ok, fail } = require('../../core/response')
const service = require('./profile.service')

// The client sends its current refresh token in the X-Refresh-Token header so
// the server can mark the matching session row as "current" in the list view
// and refuse to revoke it. Falls back to body for endpoints with a JSON body.
function currentRefreshToken(req) {
  return req.get('x-refresh-token') || req.body?.refreshToken || null
}

module.exports = {
  async getProfile(req, res) {
    try {
      const user = await service.getProfile(req.user.id)
      return ok(res, { user })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async updateProfile(req, res) {
    try {
      const result = await service.updateProfile(req.user.id, req.body)
      const msg = result.verificationSent
        ? 'Profile updated — please verify your new email address.'
        : 'Profile updated'
      return ok(res, result, msg)
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async listSessions(req, res) {
    try {
      const sessions = await service.listSessions(req.user.id, currentRefreshToken(req))
      return ok(res, { sessions })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async revokeSession(req, res) {
    try {
      await service.revokeSession(req.user.id, req.params.id, currentRefreshToken(req))
      return ok(res, null, 'Session revoked')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async revokeAllOtherSessions(req, res) {
    try {
      const result = await service.revokeAllOtherSessions(req.user.id, currentRefreshToken(req))
      return ok(res, result, `Revoked ${result.revoked} other session(s)`)
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
