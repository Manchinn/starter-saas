const { JournalLine, Journal, ChartOfAccount } = require('../../../../server/models')
const { Op } = require('sequelize')

// Cash Flow Statement — direct method.
//
// Cash/bank accounts are those with statementCategory 'cash_and_equivalents'.
// For every posted journal that touches cash, the net cash movement is
// classified into operating / investing / financing by the nature of the
// largest non-cash line in that journal:
//   - revenue / expense                         → operating
//   - asset (property_plant_equipment)          → investing,  other assets → operating
//   - liability (long/short-term borrowings)    → financing,  other liab.  → operating
//   - equity                                    → financing
//
// Net change = Σ cash-line (debit - credit); ending = beginning + net.

const round2 = (v) => Math.round(Number(v || 0) * 100) / 100
const CASH_CATEGORY = 'cash_and_equivalents'
const FINANCING_LIABILITY = new Set(['long_term_borrowings', 'short_term_borrowings'])

const sectionFor = (account) => {
  if (!account) return 'operating'
  switch (account.accountType) {
    case 'revenue':
    case 'expense':
      return 'operating'
    case 'asset':
      return account.statementCategory === 'property_plant_equipment' ? 'investing' : 'operating'
    case 'liability':
      return FINANCING_LIABILITY.has(account.statementCategory) ? 'financing' : 'operating'
    case 'equity':
      return 'financing'
    default:
      return 'operating'
  }
}

const delta = (l) => Number(l.debit || 0) - Number(l.credit || 0) // inflow positive on a cash account

const getStatement = async ({ fromDate, toDate, organizationId }) => {
  const cashAccounts = await ChartOfAccount.findAll({
    where: { organizationId: organizationId || null, statementCategory: CASH_CATEGORY, dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'code', 'name'],
  })
  const cashIds = new Set(cashAccounts.map((a) => a.id))

  const accInclude = { model: ChartOfAccount, as: 'account', attributes: ['id', 'code', 'name', 'accountType', 'statementCategory'] }
  const lineWhere = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }

  // Beginning cash balance: net cash movement of posted journals before fromDate.
  let beginning = 0
  if (fromDate && cashIds.size) {
    const priorLines = await JournalLine.findAll({
      where: { ...lineWhere, accountId: { [Op.in]: [...cashIds] } },
      include: [{ model: Journal, as: 'journal', attributes: [], where: { status: 'posted', dataFlag: { [Op.ne]: 2 }, date: { [Op.lt]: fromDate } }, required: true }],
    })
    beginning = priorLines.reduce((s, l) => s + delta(l), 0)
  }

  // Period journals that touch cash.
  const journalWhere = { status: 'posted', dataFlag: { [Op.ne]: 2 } }
  const dateWhere = {}
  if (fromDate) dateWhere[Op.gte] = fromDate
  if (toDate)   dateWhere[Op.lte] = toDate
  if (fromDate || toDate) journalWhere.date = dateWhere

  const lines = await JournalLine.findAll({
    where: lineWhere,
    include: [
      { model: Journal, as: 'journal', attributes: ['id', 'date', 'description', 'sourceType'], where: journalWhere, required: true },
      accInclude,
    ],
  })

  // Group lines by journal.
  const byJournal = new Map()
  for (const l of lines) {
    const jid = l.journal.id
    if (!byJournal.has(jid)) byJournal.set(jid, { journal: l.journal, lines: [] })
    byJournal.get(jid).lines.push(l)
  }

  const sections = {
    operating: { amount: 0, entries: [] },
    investing: { amount: 0, entries: [] },
    financing: { amount: 0, entries: [] },
  }

  for (const { journal, lines: jlines } of byJournal.values()) {
    const cashLines = jlines.filter((l) => cashIds.has(l.accountId))
    if (!cashLines.length) continue
    const cashDelta = round2(cashLines.reduce((s, l) => s + delta(l), 0))
    if (cashDelta === 0) continue

    // Largest non-cash line drives the classification.
    const nonCash = jlines.filter((l) => !cashIds.has(l.accountId))
    let driver = null
    let max = -1
    for (const l of nonCash) {
      const mag = Math.abs(delta(l))
      if (mag > max) { max = mag; driver = l.account }
    }
    const section = sectionFor(driver)
    sections[section].amount = round2(sections[section].amount + cashDelta)
    sections[section].entries.push({
      journalId:   journal.id,
      date:        journal.date,
      description: journal.description,
      sourceType:  journal.sourceType,
      account:     driver ? { code: driver.code, name: driver.name } : null,
      amount:      cashDelta,
    })
  }

  const netChange = round2(sections.operating.amount + sections.investing.amount + sections.financing.amount)
  const ending = round2(beginning + netChange)

  return {
    fromDate: fromDate || null,
    toDate:   toDate || null,
    cashAccounts: cashAccounts.map((a) => ({ code: a.code, name: a.name })),
    operating: sections.operating,
    investing: sections.investing,
    financing: sections.financing,
    netChange,
    beginning: round2(beginning),
    ending,
  }
}

module.exports = { getStatement, sectionFor }
