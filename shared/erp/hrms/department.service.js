const { Department } = require('../../../server/models')
const { Op } = require('sequelize')

const list = async ({ organizationId, page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = {
    organizationId,
    ...(search && {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ],
    }),
  }

  const { count, rows } = await Department.findAndCountAll({
    where,
    offset,
    limit,
    order: [['name', 'ASC']],
  })

  return { departments: rows, total: count }
}

const create = async (data) => {
  return await Department.create(data)
}

const getById = async (id, organizationId) => {
  return await Department.findOne({ where: { id, organizationId } })
}

const update = async (id, organizationId, data) => {
  const department = await getById(id, organizationId)
  if (!department) throw new Error('Department not found')
  return await department.update(data)
}

const remove = async (id, organizationId) => {
  const department = await getById(id, organizationId)
  if (!department) throw new Error('Department not found')
  return await department.destroy()
}

module.exports = {
  list,
  create,
  getById,
  update,
  remove,
}
