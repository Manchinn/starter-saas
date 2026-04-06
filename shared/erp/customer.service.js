const { Customer } = require('../../server/models')
const { Op } = require('sequelize')

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { company: { [Op.like]: `%${search}%` } },
        ],
      }
    : {}

  const { count, rows } = await Customer.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, customers: rows }
}

const getById = async (id) => {
  const customer = await Customer.findByPk(id)
  if (!customer) throw { status: 404, message: 'Customer not found' }
  return customer
}

const create = async ({ name, email, phone, company, address, notes, status = 'active' }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  return Customer.create({ name: name.trim(), email, phone, company, address, notes, status })
}

const update = async (id, data) => {
  const customer = await Customer.findByPk(id)
  if (!customer) throw { status: 404, message: 'Customer not found' }
  const allowed = ['name', 'email', 'phone', 'company', 'address', 'notes', 'status']
  const patch = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => allowed.includes(k) && v !== undefined)
  )
  await customer.update(patch)
  return customer.reload()
}

const remove = async (id) => {
  const customer = await Customer.findByPk(id)
  if (!customer) throw { status: 404, message: 'Customer not found' }
  await customer.destroy()
}

module.exports = { list, getById, create, update, remove }
