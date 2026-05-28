const { TaxPeriod, FiscalYear } = require('../../../../server/models')
const { Op } = require('sequelize')
const { findByPkScoped } = require('../../../../server/core/tenant')

const fmtDate = (d) => {
  if (!d) return null
  if (typeof d === 'string') return d.slice(0, 10)
  return new Date(d).toISOString().slice(0, 10)
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
const list = async ({ status, organizationId } = {}) => {
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (status) where.status = status
  return TaxPeriod.findAll({ where, order: [['startDate', 'DESC']] })
}

const getById = async (id, organizationId) => {
  const p = await findByPkScoped(TaxPeriod, id, organizationId)
  if (!p) throw { status: 404, message: 'Tax period not found' }
  return p
}

const create = async ({ name, startDate, endDate, notes, userId, organizationId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (!startDate || !endDate) throw { status: 400, message: 'Start and end dates are required' }
  if (fmtDate(startDate) >= fmtDate(endDate)) throw { status: 400, message: 'End date must be after start date' }
  return TaxPeriod.create({
    name: name.trim(),
    startDate, endDate,
    notes: notes?.trim() || null,
    status: 'open',
    organizationId: organizationId || null,
    createdBy: userId || null, modifiedBy: userId || null,
  })
}

const update = async (id, { name, startDate, endDate, notes }, userId, organizationId) => {
  const p = await getById(id, organizationId)
  if (p.status === 'closed') throw { status: 400, message: 'Closed periods cannot be edited' }
  const newStart = startDate || p.startDate
  const newEnd   = endDate   || p.endDate
  if (fmtDate(newStart) >= fmtDate(newEnd)) throw { status: 400, message: 'End date must be after start date' }
  await p.update({
    ...(name      !== undefined && { name: name?.trim() || p.name }),
    ...(startDate !== undefined && { startDate }),
    ...(endDate   !== undefined && { endDate }),
    ...(notes     !== undefined && { notes: notes?.trim() || null }),
    modifiedBy: userId || null,
  })
  return p
}

const close = async (id, userId, organizationId) => {
  const p = await getById(id, organizationId)
  if (p.status === 'closed') return p
  await p.update({ status: 'closed', closedBy: userId || null, closedAt: new Date(), modifiedBy: userId || null })
  return p
}

const reopen = async (id, userId, organizationId) => {
  const p = await getById(id, organizationId)
  if (p.status === 'open') return p
  await p.update({ status: 'open', closedBy: null, closedAt: null, modifiedBy: userId || null })
  return p
}

const remove = async (id, organizationId) => {
  const p = await getById(id, organizationId)
  if (p.status === 'closed') throw { status: 400, message: 'Closed periods cannot be deleted' }
  await p.destroy()
}

// ── Lock enforcement ──────────────────────────────────────────────────────────
/**
 * Throw 400 if `date` falls inside a closed TaxPeriod OR a closed FiscalYear
 * for this organization.
 */
const assertOpen = async (date, organizationId) => {
  if (!date) return
  const d = fmtDate(date)
  const orgWhere = { organizationId: organizationId || null }

  const lockedTaxPeriod = await TaxPeriod.findOne({
    where: {
      ...orgWhere,
      status: 'closed',
      dataFlag: { [Op.ne]: 2 },
      startDate: { [Op.lte]: d },
      endDate:   { [Op.gte]: d },
    },
  })
  if (lockedTaxPeriod) {
    throw { status: 400, message: `Tax period "${lockedTaxPeriod.name}" is closed — transactions dated ${d} cannot be posted or edited.` }
  }

  const lockedFY = await FiscalYear.findOne({
    where: {
      ...orgWhere,
      status: 'closed',
      dataFlag: { [Op.ne]: 2 },
      startDate: { [Op.lte]: d },
      endDate:   { [Op.gte]: d },
    },
  })
  if (lockedFY) {
    throw { status: 400, message: `Fiscal year "${lockedFY.name}" is closed — transactions dated ${d} cannot be posted or edited.` }
  }
}

// ── VAT Report ────────────────────────────────────────────────────────────────
/**
 * For a given tax period, sum posted journal lines on Output Tax (2140) and
 * Input Tax (1160). Returns totals + per-line breakdown + net VAT payable.
 *
 * Output VAT (liability, credit balance): amount = credit − debit (reversals subtract)
 * Input  VAT (asset, debit balance):       amount = debit − credit
 */
const getVatReport = async (periodId, organizationId) => {
  const period = await getById(periodId, organizationId)
  const { Journal, JournalLine, ChartOfAccount } = require('../../../../server/models')
  const accountsSvc = require('./account-mapping.service')

  const outputAcc = await accountsSvc.getByCode('2140', organizationId)
  const inputAcc  = await accountsSvc.getByCode('1160', organizationId)
  const accountIds = [outputAcc?.id, inputAcc?.id].filter(Boolean)
  if (!accountIds.length) {
    return {
      period,
      outputTax: { total: 0, lines: [] },
      inputTax:  { total: 0, lines: [] },
      netPayable: 0,
      message: 'Output/Input Tax accounts (2140/1160) are not configured. Add them to Chart of Accounts to enable VAT reports.',
    }
  }

  const lines = await JournalLine.findAll({
    where: { accountId: accountIds, organizationId: organizationId || null },
    include: [
      {
        model: Journal,
        as: 'journal',
        where: {
          status: 'posted',
          organizationId: organizationId || null,
          dataFlag: { [Op.ne]: 2 },
          date: { [Op.between]: [period.startDate, period.endDate] },
        },
        required: true,
      },
      { model: ChartOfAccount, as: 'account', attributes: ['id', 'code', 'name'] },
    ],
    order: [[{ model: Journal, as: 'journal' }, 'date', 'ASC']],
  })

  const out = { total: 0, lines: [] }
  const inp = { total: 0, lines: [] }
  for (const l of lines) {
    const debit  = Number(l.debit)  || 0
    const credit = Number(l.credit) || 0
    const row = {
      id:           l.id,
      journalId:    l.journalId,
      journalRefNo: l.journal?.refNo,
      journalDate:  l.journal?.date,
      description:  l.description,
      sourceType:   l.journal?.sourceType,
      sourceId:     l.journal?.sourceId,
      debit, credit,
    }
    if (l.accountId === outputAcc?.id) {
      const amount = credit - debit
      row.amount = amount
      out.total += amount
      out.lines.push(row)
    } else if (l.accountId === inputAcc?.id) {
      const amount = debit - credit
      row.amount = amount
      inp.total += amount
      inp.lines.push(row)
    }
  }

  return {
    period,
    outputTax: out,
    inputTax:  inp,
    netPayable: out.total - inp.total,
  }
}

module.exports = { list, getById, create, update, close, reopen, remove, assertOpen, getVatReport }
