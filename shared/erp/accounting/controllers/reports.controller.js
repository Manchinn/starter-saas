const trialBalanceSvc  = require('../services/trial-balance.service')
const generalLedgerSvc = require('../services/general-ledger.service')

const orgOf = (req) => req.user?.organizationId || req.user?.id

const trialBalance = async (req, res, next) => {
  try {
    const { asOfDate, includeZero } = req.query
    const report = await trialBalanceSvc.getReport({
      asOfDate,
      includeZero: includeZero === 'true' || includeZero === '1',
      organizationId: orgOf(req),
    })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

const generalLedger = async (req, res, next) => {
  try {
    const { accountId, fromDate, toDate } = req.query
    const report = await generalLedgerSvc.getReport({
      accountId, fromDate, toDate, organizationId: orgOf(req),
    })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

module.exports = { trialBalance, generalLedger }
