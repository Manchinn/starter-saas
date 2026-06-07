const { JournalLine, Journal, ChartOfAccount } = require('../../../../server/models')
const { Op } = require('sequelize')

const round2 = (v) => Math.round(v * 100) / 100

/**
 * Trial Balance (งบทดลอง) — every account with a non-zero balance built up from
 * POSTED journal lines on or before `asOfDate`. Each account's net movement is
 * placed in the debit or credit column according to its normal balance, so the
 * column totals tie out (total debit === total credit).
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const safeDate = (v) => {
  const s = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : null
  return s && DATE_RE.test(s) ? s : null
}

const getReport = async ({ asOfDate, includeZero = false, organizationId } = {}) => {
  const today = safeDate(asOfDate) || new Date().toISOString().slice(0, 10)

  const journalWhere = { status: 'posted', dataFlag: { [Op.ne]: 2 }, date: { [Op.lte]: today } }

  const lines = await JournalLine.findAll({
    where: { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } },
    include: [
      { model: Journal, as: 'journal', attributes: [], where: journalWhere, required: true },
      {
        model: ChartOfAccount, as: 'account',
        attributes: ['id', 'code', 'name', 'accountType', 'statementCategory', 'normalBalance'],
      },
    ],
  })

  // Aggregate debit/credit per account.
  const map = new Map()
  for (const l of lines) {
    const acc = l.account
    if (!acc) continue
    if (!map.has(acc.id)) {
      map.set(acc.id, {
        id:                acc.id,
        code:              acc.code,
        name:              acc.name,
        accountType:       acc.accountType,
        statementCategory: acc.statementCategory,
        normalBalance:     acc.normalBalance,
        debit:  0,
        credit: 0,
      })
    }
    const row = map.get(acc.id)
    row.debit  += Number(l.debit  || 0)
    row.credit += Number(l.credit || 0)
  }

  const rows = []
  const totals = { debit: 0, credit: 0 }

  for (const r of map.values()) {
    // Net movement, expressed on the account's normal side.
    const net = r.normalBalance === 'credit'
      ? r.credit - r.debit
      : r.debit - r.credit

    const debit  = net >= 0 ? (r.normalBalance === 'debit'  ? net : 0)
                            : (r.normalBalance === 'credit' ? -net : 0)
    const credit = net >= 0 ? (r.normalBalance === 'credit' ? net : 0)
                            : (r.normalBalance === 'debit'  ? -net : 0)

    if (!includeZero && round2(debit) === 0 && round2(credit) === 0) continue

    rows.push({
      code:              r.code,
      name:              r.name,
      accountType:       r.accountType,
      statementCategory: r.statementCategory,
      debit:  round2(debit),
      credit: round2(credit),
    })
    totals.debit  += debit
    totals.credit += credit
  }

  rows.sort((a, b) => String(a.code).localeCompare(String(b.code)))

  return {
    asOfDate: today,
    rows,
    totals: { debit: round2(totals.debit), credit: round2(totals.credit) },
  }
}

module.exports = { getReport }
