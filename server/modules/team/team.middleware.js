/**
 * Gate for the team (staff self-service) endpoints.
 *
 * A tenant's owner account (a top-level user with no organizationId) always
 * manages its own staff; staff members need the delegable `team.manage`
 * permission. System admins pass via the wildcard.
 */
const { resolvePermissions } = require('../../middleware/permission')

const requireTeamManager = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' })
  try {
    // Owner accounts (the org itself) are implicitly allowed.
    if (!req.user.organizationId) return next()
    const perms = await resolvePermissions(req.user)
    if (perms.has('*') || perms.has('team.manage')) return next()
    return res.status(403).json({ success: false, message: 'Insufficient permissions' })
  } catch {
    return res.status(500).json({ success: false, message: 'Permission check failed' })
  }
}

module.exports = { requireTeamManager }
