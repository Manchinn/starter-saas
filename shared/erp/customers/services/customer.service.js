const { Customer, CustomerGroup } = require('../../../../server/models')
const { Op } = require('sequelize')
const { findByPkScoped } = require('../../../../server/core/tenant')

const list = async ({ page = 1, limit = 20, search = '', groupId = '', status = '', activeFrom = '', activeTo = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { company: { [Op.like]: `%${search}%` } },
    ]
  }
  if (groupId) where.customerGroupId = groupId
  if (status) where.status = status
  if (activeFrom) where.activeFrom = { [Op.gte]: activeFrom }
  if (activeTo) where.activeTo = { [Op.lte]: activeTo }

  const { count, rows } = await Customer.findAndCountAll({
    where,
    include: [{ model: CustomerGroup, as: 'group', attributes: ['id', 'name'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, customers: rows }
}

const getById = async (id, organizationId) => {
  const customer = await findByPkScoped(Customer, id, organizationId, {
    include: [{ model: CustomerGroup, as: 'group', attributes: ['id', 'name'] }],
  })
  if (!customer) throw { status: 404, message: 'Customer not found' }
  return customer
}

const create = async ({ name, code, autoCode, email, phone, company, address, notes, status = 'active', activeFrom, activeTo, customerGroupId, userId, organizationId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  let customerCode = null
  if (autoCode) {
    const seqSvc = require('../../settings/services/sequence.service')
    customerCode = await seqSvc.getNext('CUS', userId)
  } else if (code?.trim()) {
    const existing = await Customer.findOne({ where: { code: code.trim() } })
    if (existing) throw { status: 400, message: 'Customer code already exists' }
    customerCode = code.trim()
  }
  return Customer.create({ code: customerCode, name: name.trim(), email, phone, company, address, notes, status, activeFrom: activeFrom || null, activeTo: activeTo || null, customerGroupId: customerGroupId || null, organizationId: organizationId || null, createdBy: userId || null, modifiedBy: userId || null })
}

const update = async (id, data, userId, organizationId) => {
  const customer = await findByPkScoped(Customer, id, organizationId)
  if (!customer) throw { status: 404, message: 'Customer not found' }
  const allowed = ['code', 'name', 'email', 'phone', 'company', 'address', 'notes', 'status', 'activeFrom', 'activeTo', 'customerGroupId']
  const patch = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => allowed.includes(k) && v !== undefined)
  )
  if ('customerGroupId' in data) patch.customerGroupId = data.customerGroupId || null
  if ('activeFrom' in patch) patch.activeFrom = patch.activeFrom || null
  if ('activeTo'   in patch) patch.activeTo   = patch.activeTo   || null
  patch.modifiedBy = userId || null
  await customer.update(patch)
  return customer.reload()
}

const remove = async (id, organizationId) => {
  const customer = await findByPkScoped(Customer, id, organizationId)
  if (!customer) throw { status: 404, message: 'Customer not found' }
  await customer.destroy()
}

module.exports = { list, getById, create, update, remove }
