const { TaxPeriod, FiscalYear } = require('../../../../server/models')
const { Op } = require('sequelize')

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

const getById = async (id) => {
  const p = await TaxPeriod.findByPk(id)
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

const update = async (id, { name, startDate, endDate, notes }, userId) => {
  const p = await getById(id)
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

const close = async (id, userId) => {
  const p = await getById(id)
  if (p.status === 'closed') return p
  await p.update({ status: 'closed', closedBy: userId || null, closedAt: new Date(), modifiedBy: userId || null })
  return p
}

const reopen = async (id, userId) => {
  const p = await getById(id)
  if (p.status === 'open') return p
  await p.update({ status: 'open', closedBy: null, closedAt: null, modifiedBy: userId || null })
  return p
}

const remove = async (id) => {
  const p = await getById(id)
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

module.exports = { list, getById, create, update, close, reopen, remove, assertOpen }
