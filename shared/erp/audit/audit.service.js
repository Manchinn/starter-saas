const { AuditLog } = require('../../../server/models')
const { Op } = require('sequelize')

/**
 * Record an audit event. Never throws — audit failures must not break
 * the underlying business operation.
 *
 * Call with:
 *   audit.log({ user, action: 'invoice.send', entityType: 'Invoice', entityId, summary })
 */
const log = async ({ user, userId, userEmail, action, entityType, entityId, summary, organizationId }) => {
  try {
    await AuditLog.create({
      userId:    user?.id    || userId    || null,
      userEmail: user?.email || userEmail || null,
      action,
      entityType,
      entityId:  entityId || null,
      summary:   summary || null,
      organizationId: organizationId || user?.organizationId || (user?.id || null),
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to record event', action, err.message || err)
  }
}

const list = async ({ page = 1, limit = 50, entityType = '', entityId = '', userId = '', action = '', dateFrom = '', dateTo = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null }
  if (entityType) where.entityType = entityType
  if (entityId)   where.entityId   = entityId
  if (userId)     where.userId     = userId
  if (action)     where.action     = { [Op.like]: `%${action}%` }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom)
    if (dateTo)   where.createdAt[Op.lte] = new Date(`${dateTo}T23:59:59.999Z`)
  }

  const { count, rows } = await AuditLog.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
  })
  return { total: count, page, limit, logs: rows }
}

module.exports = { log, list }
