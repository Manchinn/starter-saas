const { AuditLog } = require('../../../server/models')
const { Op } = require('sequelize')
const logger = require('../../../server/core/logger').forLabel('audit')

/**
 * Record an audit event. Never throws — audit failures must not break
 * the underlying business operation.
 *
 * Call with:
 *   audit.log({ user, action: 'invoice.send', entityType: 'Invoice', entityId, summary })
 */
const buildRow = async ({ user, userId, userEmail, action, entityType, entityId, summary, organizationId }, transaction) => {
  const resolvedUserId = user?.id || userId || null
  let orgId = organizationId || user?.organizationId || user?.id || null
  let resolvedEmail = user?.email || userEmail || null

  // Most callers only pass userId — look up the user to derive the effective
  // organizationId so audit rows are visible in the org-scoped list query.
  // Same convention as controllers: organizationId || user.id (self-org).
  if ((!orgId || !resolvedEmail) && resolvedUserId) {
    const { User } = require('../../../server/models')
    const options = { attributes: ['id', 'organizationId', 'email'] }
    if (transaction) options.transaction = transaction
    const u = await User.findByPk(resolvedUserId, options)
    if (u) {
      orgId = orgId || u.organizationId || u.id
      resolvedEmail = resolvedEmail || u.email
    }
  }

  return {
    userId: resolvedUserId,
    userEmail: resolvedEmail,
    action,
    entityType,
    entityId: entityId || null,
    summary: summary || null,
    organizationId: orgId,
  }
}

// Security-sensitive callers can require the audit row to commit atomically
// with their business mutation.
const logStrict = async (event, { transaction } = {}) => {
  const row = await buildRow(event, transaction)
  return transaction ? AuditLog.create(row, { transaction }) : AuditLog.create(row)
}

const log = async (event) => {
  try {
    await logStrict(event)
  } catch (err) {
    logger.error('failed to record event', { action: event.action, error: err.message || String(err) })
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

module.exports = { log, logStrict, list }
