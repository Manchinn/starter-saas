/**
 * Restrict route to specific roles.
 * Usage: requireRole('admin') or requireRole('admin', 'manager')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' })
  }
  next()
}

module.exports = { requireRole }
