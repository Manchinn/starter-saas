const { Role, Permission } = require('../models')
const { employeePermissionSlugs } = require('../../shared/hrms/services/access.service')

/**
 * Resolve all permission slugs for a user.
 * System admins (user.role === 'admin') get a wildcard '*' — they pass every check.
 * Grants come from the user's platform roles plus any HRMS roles attached to
 * their linked Employee record.
 */
async function resolvePermissions(user) {
  if (user.role === 'admin') return new Set(['*'])
  const roles = await user.getRoles({ include: [{ model: Permission, as: 'permissions' }] })
  const slugs = roles.flatMap((r) => r.permissions.map((p) => p.slug))
  const hrmsSlugs = await employeePermissionSlugs(user.id)
  return new Set([...slugs, ...hrmsSlugs])
}

/**
 * requirePermission('users.edit', 'users.delete')
 * Passes if the user has ANY of the listed permission slugs (or is system admin).
 */
const requirePermission = (...slugs) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  try {
    const perms = await resolvePermissions(req.user)
    if (perms.has('*') || slugs.some((s) => perms.has(s))) return next()
    return res.status(403).json({ success: false, message: 'Insufficient permissions' })
  } catch {
    return res.status(500).json({ success: false, message: 'Permission check failed' })
  }
}

module.exports = { requirePermission, resolvePermissions }
