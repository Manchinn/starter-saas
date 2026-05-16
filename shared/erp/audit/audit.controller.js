const svc = require('./audit.service')

const list = async (req, res, next) => {
  try {
    const orgId = req.user?.organizationId || req.user?.id
    const { page, limit, entityType, entityId, userId, action, dateFrom, dateTo } = req.query
    const result = await svc.list({
      page: +page || 1, limit: +limit || 50,
      entityType: entityType || '', entityId: entityId || '',
      userId: userId || '', action: action || '',
      dateFrom: dateFrom || '', dateTo: dateTo || '',
      organizationId: orgId,
    })
    res.json({ data: result })
  } catch (err) { next(err) }
}

module.exports = { list }
