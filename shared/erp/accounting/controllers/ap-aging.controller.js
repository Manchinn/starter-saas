const svc = require('../services/ap-aging.service')

const getReport = async (req, res, next) => {
  try {
    const { asOfDate, vendorId } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    const report = await svc.getReport({ asOfDate, vendorId, organizationId })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

module.exports = { getReport }
