const trialBalanceSvc  = require('../services/trial-balance.service')
const generalLedgerSvc = require('../services/general-ledger.service')

const orgOf = (req) => req.user?.organizationId || req.user?.id

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const qstr   = (v) => typeof v === 'string' ? v : Array.isArray(v) ? v[0] : null
const qdate  = (v) => { const s = qstr(v); return s && DATE_RE.test(s) ? s : null }

const trialBalance = async (req, res, next) => {
  try {
    const asOfDate    = qdate(req.query.asOfDate)
    const includeZero = req.query.includeZero
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
    const accountId = qstr(req.query.accountId)
    const fromDate  = qdate(req.query.fromDate)
    const toDate    = qdate(req.query.toDate)
    const report = await generalLedgerSvc.getReport({
      accountId, fromDate, toDate, organizationId: orgOf(req),
    })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

module.exports = { trialBalance, generalLedger }
