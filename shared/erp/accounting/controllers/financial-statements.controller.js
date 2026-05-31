const svc = require('../services/financial-statements.service')

const orgOf = (req) => req.user?.organizationId || req.user?.id
const today = () => new Date().toISOString().slice(0, 10)

// Shift a YYYY-MM-DD date back one year (default comparative period).
const priorYear = (date) => {
  if (!date) return null
  const [y, m, d] = date.slice(0, 10).split('-')
  return `${Number(y) - 1}-${m}-${d}`
}

const balanceSheet = async (req, res, next) => {
  try {
    const asOfDate = req.query.asOfDate || today()
    const comparativeDate = req.query.comparativeDate || priorYear(asOfDate)
    const report = await svc.balanceSheet({ asOfDate, comparativeDate, organizationId: orgOf(req) })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

const incomeStatement = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query
    const from = fromDate || `${today().slice(0, 4)}-01-01`
    const to   = toDate || today()
    const comparativeFromDate = req.query.comparativeFromDate || priorYear(from)
    const comparativeToDate   = req.query.comparativeToDate || priorYear(to)
    const report = await svc.incomeStatement({ fromDate: from, toDate: to, comparativeFromDate, comparativeToDate, organizationId: orgOf(req) })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

const changesInEquity = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query
    const from = fromDate || `${today().slice(0, 4)}-01-01`
    const to   = toDate || today()
    const comparativeFromDate = req.query.comparativeFromDate || priorYear(from)
    const comparativeToDate   = req.query.comparativeToDate || priorYear(to)
    const report = await svc.changesInEquity({ fromDate: from, toDate: to, comparativeFromDate, comparativeToDate, organizationId: orgOf(req) })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

const notes = async (req, res, next) => {
  try {
    const asOfDate = req.query.asOfDate || today()
    const comparativeDate = req.query.comparativeDate || priorYear(asOfDate)
    const report = await svc.notes({ asOfDate, comparativeDate, organizationId: orgOf(req) })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

module.exports = { balanceSheet, incomeStatement, changesInEquity, notes }
