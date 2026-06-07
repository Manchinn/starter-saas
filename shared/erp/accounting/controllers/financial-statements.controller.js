const svc = require('../services/financial-statements.service')

const orgOf = (req) => req.user?.organizationId || req.user?.id
const today = () => new Date().toISOString().slice(0, 10)

// Safely extract a scalar string from a query param that Express may parse as
// an array or object when the client sends repeated keys or bracket notation.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const qdate = (v) => {
  const s = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : null
  return s && DATE_RE.test(s) ? s : null
}

// Shift a YYYY-MM-DD date back one year (default comparative period).
const priorYear = (date) => {
  if (!date) return null
  const [y, m, d] = date.split('-')
  return `${Number(y) - 1}-${m}-${d}`
}

const balanceSheet = async (req, res, next) => {
  try {
    const asOfDate = qdate(req.query.asOfDate) || today()
    const comparativeDate = qdate(req.query.comparativeDate) || priorYear(asOfDate)
    const report = await svc.balanceSheet({ asOfDate, comparativeDate, organizationId: orgOf(req) })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

const incomeStatement = async (req, res, next) => {
  try {
    const from = qdate(req.query.fromDate) || `${today().slice(0, 4)}-01-01`
    const to   = qdate(req.query.toDate) || today()
    const comparativeFromDate = qdate(req.query.comparativeFromDate) || priorYear(from)
    const comparativeToDate   = qdate(req.query.comparativeToDate) || priorYear(to)
    const report = await svc.incomeStatement({ fromDate: from, toDate: to, comparativeFromDate, comparativeToDate, organizationId: orgOf(req) })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

const changesInEquity = async (req, res, next) => {
  try {
    const from = qdate(req.query.fromDate) || `${today().slice(0, 4)}-01-01`
    const to   = qdate(req.query.toDate) || today()
    const comparativeFromDate = qdate(req.query.comparativeFromDate) || priorYear(from)
    const comparativeToDate   = qdate(req.query.comparativeToDate) || priorYear(to)
    const report = await svc.changesInEquity({ fromDate: from, toDate: to, comparativeFromDate, comparativeToDate, organizationId: orgOf(req) })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

const notes = async (req, res, next) => {
  try {
    const asOfDate = qdate(req.query.asOfDate) || today()
    const comparativeDate = qdate(req.query.comparativeDate) || priorYear(asOfDate)
    const report = await svc.notes({ asOfDate, comparativeDate, organizationId: orgOf(req) })
    res.json({ data: { report } })
  } catch (err) { next(err) }
}

module.exports = { balanceSheet, incomeStatement, changesInEquity, notes }
