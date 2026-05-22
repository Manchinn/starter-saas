const { FiscalYear } = require('../../../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where  = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status

  const { count, rows } = await FiscalYear.findAndCountAll({
    where, limit, offset,
    order: [['startDate', 'DESC']],
  })
  return { total: count, page, limit, fiscalYears: rows }
}

const getById = async (id) => {
  const fy = await FiscalYear.findByPk(id)
  if (!fy) throw { status: 404, message: 'Fiscal Year not found' }
  return fy
}

const create = async ({ name, startDate, endDate, notes, userId, organizationId }) => {
  if (!name?.trim())  throw { status: 400, message: 'Name is required' }
  if (!startDate)     throw { status: 400, message: 'Start date is required' }
  if (!endDate)       throw { status: 400, message: 'End date is required' }
  if (startDate >= endDate) throw { status: 400, message: 'End date must be after start date' }

  const fy = await FiscalYear.create({
    name: name.trim(),
    startDate,
    endDate,
    notes: notes?.trim() || null,
    status: 'open',
    organizationId: organizationId || null,
    createdBy:  userId || null,
    modifiedBy: userId || null,
  })
  return getById(fy.id)
}

const update = async (id, { name, startDate, endDate, notes, userId }) => {
  const fy = await FiscalYear.findByPk(id)
  if (!fy)                  throw { status: 404, message: 'Fiscal Year not found' }
  if (fy.status === 'closed') throw { status: 400, message: 'Closed fiscal years cannot be edited' }

  if (name !== undefined && !name?.trim()) throw { status: 400, message: 'Name cannot be empty' }
  const newStart = startDate || fy.startDate
  const newEnd   = endDate   || fy.endDate
  if (newStart >= newEnd) throw { status: 400, message: 'End date must be after start date' }

  await fy.update({
    name:      name?.trim() ?? fy.name,
    startDate: startDate    ?? fy.startDate,
    endDate:   endDate      ?? fy.endDate,
    notes:     notes !== undefined ? (notes?.trim() || null) : fy.notes,
    modifiedBy: userId || null,
  })
  return getById(id)
}
const close = async (id, userId) => {
  const fy = await FiscalYear.findByPk(id)
  if (!fy)                  throw { status: 404, message: 'Fiscal Year not found' }
  if (fy.status === 'closed') throw { status: 400, message: 'Fiscal Year is already closed' }
  await fy.update({ status: 'closed', modifiedBy: userId || null })
  return getById(id)
}

const remove = async (id) => {
  const fy = await FiscalYear.findByPk(id)
  if (!fy)                  throw { status: 404, message: 'Fiscal Year not found' }
  if (fy.status === 'closed') throw { status: 400, message: 'Closed fiscal years cannot be deleted' }
  await fy.destroy()
}

module.exports = { list, getById, create, update, close, remove }
