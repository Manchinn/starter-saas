const svc = require('../services/ar-aging.service')

const getReport = async (req, res, next) => {
  try {
    const { asOfDate, customerId } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    const report = await svc.getReport({ asOfDate, customerId, organizationId })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

module.exports = { getReport }
