const svc = require('../services/cash-flow.service')

const getStatement = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    const report = await svc.getStatement({ fromDate, toDate, organizationId })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

module.exports = { getStatement }
