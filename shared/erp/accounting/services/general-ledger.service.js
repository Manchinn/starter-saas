const { JournalLine, Journal, ChartOfAccount } = require('../../../../server/models')
const { Op } = require('sequelize')
const { findByPkScoped } = require('../../../../server/core/tenant')

const round2 = (v) => Math.round(v * 100) / 100

// Signed movement of a line expressed on the account's normal side.
const movement = (line, normalBalance) =>
  normalBalance === 'credit'
    ? Number(line.credit || 0) - Number(line.debit  || 0)
    : Number(line.debit  || 0) - Number(line.credit || 0)

/**
 * General Ledger (บัญชีแยกประเภท) — for one account: an opening balance brought
 * forward from POSTED lines before `fromDate`, the period's entries in date
 * order with a running balance, and a closing balance. The running balance is
 * expressed on the account's normal side (a positive balance is "normal").
 */
const getReport = async ({ accountId, fromDate, toDate, organizationId } = {}) => {
  if (!accountId) throw { status: 400, message: 'accountId is required' }

  const account = await findByPkScoped(ChartOfAccount, accountId, organizationId, {
    attributes: ['id', 'code', 'name', 'accountType', 'statementCategory', 'normalBalance'],
  })
  if (!account) throw { status: 404, message: 'Account not found' }

  const from = fromDate ? fromDate.slice(0, 10) : null
  const to   = toDate   ? toDate.slice(0, 10)   : null

  const baseLineWhere = { accountId, organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  const postedJournal = (dateWhere) => ({
    model: Journal, as: 'journal',
    attributes: ['id', 'refNo', 'date', 'description'],
    where: { status: 'posted', dataFlag: { [Op.ne]: 2 }, ...(dateWhere ? { date: dateWhere } : {}) },
    required: true,
  })

  // Opening balance: everything posted strictly before `fromDate`.
  let opening = 0
  if (from) {
    const before = await JournalLine.findAll({
      where: baseLineWhere,
      include: [postedJournal({ [Op.lt]: from })],
    })
    for (const l of before) opening += movement(l, account.normalBalance)
  }

  // Period entries.
  const rangeWhere = {}
  if (from) rangeWhere[Op.gte] = from
  if (to)   rangeWhere[Op.lte] = to
  const periodLines = await JournalLine.findAll({
    where: baseLineWhere,
    include: [postedJournal(Object.getOwnPropertySymbols(rangeWhere).length ? rangeWhere : null)],
  })

  periodLines.sort((a, b) => {
    const d = String(a.journal.date).localeCompare(String(b.journal.date))
    if (d !== 0) return d
    return String(a.journal.refNo).localeCompare(String(b.journal.refNo))
  })

  let balance = opening
  let totalDebit = 0
  let totalCredit = 0
  const entries = []
  for (const l of periodLines) {
    balance += movement(l, account.normalBalance)
    const debit  = Number(l.debit  || 0)
    const credit = Number(l.credit || 0)
    totalDebit  += debit
    totalCredit += credit
    entries.push({
      journalId:   l.journal.id,
      refNo:       l.journal.refNo,
      date:        l.journal.date,
      description: l.description || l.journal.description || null,
      debit:  round2(debit),
      credit: round2(credit),
      balance: round2(balance),
    })
  }

  return {
    account: {
      id:                account.id,
      code:              account.code,
      name:              account.name,
      accountType:       account.accountType,
      statementCategory: account.statementCategory,
      normalBalance:     account.normalBalance,
    },
    fromDate: from,
    toDate:   to,
    opening:  round2(opening),
    entries,
    closing:  round2(balance),
    totals:   { debit: round2(totalDebit), credit: round2(totalCredit) },
  }
}

module.exports = { getReport }
