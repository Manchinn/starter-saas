const svc = require('./audit.service')

const list = async (req, res, next) => {
  try {
    const orgId = req.user?.organizationId || req.user?.id
    const { cursor, limit, entityType, entityId, userId, action, dateFrom, dateTo } = req.query
    const result = await svc.list({
      limit: Math.min(+limit || 50, 200), cursor: cursor || '',
      entityType: entityType || '', entityId: entityId || '',
      userId: userId || '', action: action || '',
      dateFrom: dateFrom || '', dateTo: dateTo || '',
      organizationId: orgId,
    })
    res.json({ data: result })
  } catch (err) { next(err) }
}

module.exports = { list }
