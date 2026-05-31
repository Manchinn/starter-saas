const { JournalLine, Journal, ChartOfAccount, FiscalYear } = require('../../../../server/models')
const { Op } = require('sequelize')
const { STATEMENT_STRUCTURE } = require('./chart-of-account.service')

const round2 = (v) => Math.round(v * 100) / 100

// On a financial statement an account contributes on its TYPE's natural side,
// not its own normalBalance — so contra accounts (accumulated depreciation,
// owner drawings) correctly reduce their section total.
const DEBIT_POSITIVE = new Set(['asset', 'expense'])
const signedAmount = (line, accountType) => {
  const d = Number(line.debit || 0)
  const c = Number(line.credit || 0)
  return DEBIT_POSITIVE.has(accountType) ? d - c : c - d
}

const ONE_DAY = 86400000
const dayBefore = (date) => new Date(new Date(date).getTime() - ONE_DAY).toISOString().slice(0, 10)

// ── Core aggregation ──────────────────────────────────────────────────────────
// Net balances (signed on the account type's natural side) from POSTED journal
// lines within an optional [from, to] date range. from=null ⇒ since inception.
async function categoryTotals({ organizationId, from, to, types } = {}) {
  const journalWhere = { status: 'posted', dataFlag: { [Op.ne]: 2 } }
  const dateWhere = {}
  if (from) dateWhere[Op.gte] = from
  if (to)   dateWhere[Op.lte] = to
  if (from || to) journalWhere.date = dateWhere

  const lines = await JournalLine.findAll({
    where: { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } },
    include: [
      { model: Journal, as: 'journal', attributes: [], where: journalWhere, required: true },
      { model: ChartOfAccount, as: 'account', attributes: ['id', 'code', 'name', 'accountType', 'statementCategory', 'normalBalance'] },
    ],
  })

  const accMap = new Map()
  for (const l of lines) {
    const a = l.account
    if (!a) continue
    if (types && !types.includes(a.accountType)) continue
    if (!accMap.has(a.id)) {
      accMap.set(a.id, { id: a.id, code: a.code, name: a.name, accountType: a.accountType, statementCategory: a.statementCategory, normalBalance: a.normalBalance, amount: 0 })
    }
    accMap.get(a.id).amount += signedAmount(l, a.accountType)
  }

  const byAccount = [...accMap.values()].map((x) => ({ ...x, amount: round2(x.amount) }))
  const byCategory = {}
  const byType = {}
  for (const x of byAccount) {
    const cat = x.statementCategory || `_${x.accountType}`
    byCategory[cat] = round2((byCategory[cat] || 0) + x.amount)
    byType[x.accountType] = round2((byType[x.accountType] || 0) + x.amount)
  }
  return { byAccount, byCategory, byType }
}

async function fiscalYearFor(date, organizationId) {
  if (!date) return null
  return FiscalYear.findOne({
    where: {
      organizationId: organizationId || null,
      dataFlag: { [Op.ne]: 2 },
      startDate: { [Op.lte]: date },
      endDate:   { [Op.gte]: date },
    },
  })
}

// Build a {lines[], subtotal} section: one line per category (always present so
// current/prior columns align), each with its account breakdown.
function buildSection(accounts, categories) {
  const lines = categories.map((cat) => {
    const catAccounts = accounts.filter((a) => a.statementCategory === cat)
    return {
      category: cat,
      amount: round2(catAccounts.reduce((s, a) => s + a.amount, 0)),
      accounts: catAccounts.map((a) => ({ code: a.code, name: a.name, amount: a.amount })),
    }
  })
  return { lines, subtotal: round2(lines.reduce((s, l) => s + l.amount, 0)) }
}

// ── Statement of Financial Position (one date) ────────────────────────────────
async function balanceSheetSnapshot({ asOfDate, organizationId }) {
  const { byAccount, byType } = await categoryTotals({ organizationId, to: asOfDate })
  const S = STATEMENT_STRUCTURE.balanceSheet

  const assetAccounts     = byAccount.filter((a) => a.accountType === 'asset')
  const liabilityAccounts = byAccount.filter((a) => a.accountType === 'liability')
  const equityAccounts    = byAccount.filter((a) => a.accountType === 'equity')

  const currentAssets    = buildSection(assetAccounts, S.currentAssets)
  const nonCurrentAssets = buildSection(assetAccounts, S.nonCurrentAssets)
  const currentLiab      = buildSection(liabilityAccounts, S.currentLiabilities)
  const nonCurrentLiab   = buildSection(liabilityAccounts, S.nonCurrentLiabilities)

  const assetsTotal      = round2(byType.asset || 0)
  const liabilitiesTotal = round2(byType.liability || 0)

  // Equity presentation: owners' capital + retained earnings + profit for the
  // year. Net income is folded in because no closing entries are posted.
  const ownersCapital     = round2(equityAccounts.filter((a) => a.statementCategory !== 'retained_earnings').reduce((s, a) => s + a.amount, 0))
  const retainedPosted    = round2(equityAccounts.filter((a) => a.statementCategory === 'retained_earnings').reduce((s, a) => s + a.amount, 0))
  const netIncomeAllTime  = round2((byType.revenue || 0) - (byType.expense || 0))

  const fy = await fiscalYearFor(asOfDate, organizationId)
  let profitForYear = netIncomeAllTime
  if (fy) {
    const period = await categoryTotals({ organizationId, from: fy.startDate, to: asOfDate, types: ['revenue', 'expense'] })
    profitForYear = round2((period.byType.revenue || 0) - (period.byType.expense || 0))
  }
  const retainedEarnings = round2(retainedPosted + (netIncomeAllTime - profitForYear))
  const equityTotal = round2(ownersCapital + retainedEarnings + profitForYear)

  const liabilitiesAndEquity = round2(liabilitiesTotal + equityTotal)

  return {
    asOfDate,
    assets: {
      current: currentAssets,
      nonCurrent: nonCurrentAssets,
      total: assetsTotal,
    },
    liabilities: {
      current: currentLiab,
      nonCurrent: nonCurrentLiab,
      total: liabilitiesTotal,
    },
    equity: {
      ownersCapital,
      retainedEarnings,
      profitForYear,
      total: equityTotal,
    },
    liabilitiesAndEquity,
    balanced: Math.abs(assetsTotal - liabilitiesAndEquity) < 0.01,
  }
}

// ── Income Statement (one period) ─────────────────────────────────────────────
async function incomeStatementForPeriod({ fromDate, toDate, organizationId }) {
  const { byCategory, byAccount } = await categoryTotals({ organizationId, from: fromDate, to: toDate, types: ['revenue', 'expense'] })
  const g = (k) => round2(byCategory[k] || 0)

  const revenue       = g('revenue')
  const costOfSales   = g('cost_of_sales')
  const otherIncome   = g('other_income')
  const sellingAdmin  = g('selling_admin_expenses')
  const otherExpenses = g('other_expenses')
  const financeCosts  = g('finance_costs')
  const incomeTax     = g('income_tax_expense')

  const grossProfit            = round2(revenue - costOfSales)
  const profitBeforeFinanceTax = round2(grossProfit + otherIncome - sellingAdmin - otherExpenses)
  const profitBeforeTax        = round2(profitBeforeFinanceTax - financeCosts)
  const netProfit              = round2(profitBeforeTax - incomeTax)

  const breakdown = {}
  for (const cat of STATEMENT_STRUCTURE.incomeStatement) {
    breakdown[cat] = byAccount.filter((a) => a.statementCategory === cat).map((a) => ({ code: a.code, name: a.name, amount: a.amount }))
  }

  return {
    fromDate, toDate,
    revenue, costOfSales, grossProfit, otherIncome, sellingAdmin, otherExpenses,
    profitBeforeFinanceTax, financeCosts, profitBeforeTax, incomeTax, netProfit,
    breakdown,
  }
}

// ── Statement of Changes in Equity (one period) ───────────────────────────────
async function equityAsOf(date, organizationId) {
  const { byAccount, byType } = await categoryTotals({ organizationId, to: date })
  const equityAccounts = byAccount.filter((a) => a.accountType === 'equity')
  const ownersCapital  = round2(equityAccounts.filter((a) => a.statementCategory !== 'retained_earnings').reduce((s, a) => s + a.amount, 0))
  const retainedPosted = round2(equityAccounts.filter((a) => a.statementCategory === 'retained_earnings').reduce((s, a) => s + a.amount, 0))
  const netIncome      = round2((byType.revenue || 0) - (byType.expense || 0))
  return { ownersCapital, retainedEarnings: round2(retainedPosted + netIncome) }
}

async function changesInEquityForPeriod({ fromDate, toDate, organizationId }) {
  const opening = await equityAsOf(dayBefore(fromDate), organizationId)
  const closing = await equityAsOf(toDate, organizationId)

  // Period movements on owners'-capital accounts, split into contributions
  // (credit-normal capital accounts) and drawings (debit-normal, e.g. 3140).
  const period = await categoryTotals({ organizationId, from: fromDate, to: toDate, types: ['equity', 'revenue', 'expense'] })
  const capitalAccounts = period.byAccount.filter((a) => a.accountType === 'equity' && a.statementCategory !== 'retained_earnings')
  let contributions = 0
  let drawings = 0
  for (const a of capitalAccounts) {
    if (a.normalBalance === 'debit') drawings += -a.amount // a.amount is credit-positive ⇒ negative for a debit account
    else contributions += a.amount
  }
  contributions = round2(contributions)
  drawings = round2(drawings)
  const profitForPeriod = round2((period.byType.revenue || 0) - (period.byType.expense || 0))

  return {
    fromDate, toDate,
    opening,
    contributions,
    drawings,
    profitForPeriod,
    closing,
    total: {
      opening: round2(opening.ownersCapital + opening.retainedEarnings),
      closing: round2(closing.ownersCapital + closing.retainedEarnings),
    },
  }
}

// ── Notes: supporting schedules (account-level breakdown, current vs prior) ────
async function buildSchedules({ asOfDate, comparativeDate, organizationId }) {
  const cur = await categoryTotals({ organizationId, to: asOfDate })
  const pri = comparativeDate ? await categoryTotals({ organizationId, to: comparativeDate }) : { byAccount: [] }

  const all = STATEMENT_STRUCTURE.balanceSheet
  const bsCats = [...all.currentAssets, ...all.nonCurrentAssets, ...all.currentLiabilities, ...all.nonCurrentLiabilities, ...all.equity]
  const isCats = STATEMENT_STRUCTURE.incomeStatement
  const categories = [...bsCats, ...isCats]

  const priByCode = new Map(pri.byAccount.map((a) => [a.code, a.amount]))
  const schedules = []
  for (const cat of categories) {
    const accounts = cur.byAccount
      .filter((a) => a.statementCategory === cat)
      .map((a) => ({ code: a.code, name: a.name, current: a.amount, prior: round2(priByCode.get(a.code) || 0) }))
    if (!accounts.length) continue
    schedules.push({
      category: cat,
      accounts,
      totalCurrent: round2(accounts.reduce((s, a) => s + a.current, 0)),
      totalPrior:   round2(accounts.reduce((s, a) => s + a.prior, 0)),
    })
  }
  return schedules
}

// ── Public report functions (current + comparative prior period) ──────────────
const balanceSheet = async ({ asOfDate, comparativeDate, organizationId }) => ({
  asOfDate,
  comparativeDate: comparativeDate || null,
  current: await balanceSheetSnapshot({ asOfDate, organizationId }),
  prior: comparativeDate ? await balanceSheetSnapshot({ asOfDate: comparativeDate, organizationId }) : null,
})

const incomeStatement = async ({ fromDate, toDate, comparativeFromDate, comparativeToDate, organizationId }) => ({
  fromDate, toDate,
  comparativeFromDate: comparativeFromDate || null,
  comparativeToDate: comparativeToDate || null,
  current: await incomeStatementForPeriod({ fromDate, toDate, organizationId }),
  prior: comparativeFromDate && comparativeToDate
    ? await incomeStatementForPeriod({ fromDate: comparativeFromDate, toDate: comparativeToDate, organizationId })
    : null,
})

const changesInEquity = async ({ fromDate, toDate, comparativeFromDate, comparativeToDate, organizationId }) => ({
  fromDate, toDate,
  comparativeFromDate: comparativeFromDate || null,
  comparativeToDate: comparativeToDate || null,
  current: await changesInEquityForPeriod({ fromDate, toDate, organizationId }),
  prior: comparativeFromDate && comparativeToDate
    ? await changesInEquityForPeriod({ fromDate: comparativeFromDate, toDate: comparativeToDate, organizationId })
    : null,
})

const notes = async ({ asOfDate, comparativeDate, organizationId }) => ({
  asOfDate,
  comparativeDate: comparativeDate || null,
  schedules: await buildSchedules({ asOfDate, comparativeDate, organizationId }),
})

module.exports = {
  balanceSheet, incomeStatement, changesInEquity, notes,
  // exported for unit tests
  categoryTotals, balanceSheetSnapshot, incomeStatementForPeriod, changesInEquityForPeriod,
}
