const { Department } = require('../../../server/models')
const { Op } = require('sequelize')

const list = async ({ organizationId, page = 1, limit = 20, search = '', isActive, activeFrom = '', activeTo = '' }) => {
  const offset = (page - 1) * limit
  const where = {
    organizationId,
    dataFlag: { [Op.ne]: 2 },
    ...(search && {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ],
    }),
  }
  if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true' || isActive === true
  if (activeFrom) where.activeFrom = { [Op.gte]: activeFrom }
  if (activeTo) where.activeTo = { [Op.lte]: activeTo }

  const { count, rows } = await Department.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  })

  return { departments: rows, total: count }
}

const create = async (data) => {
  return await Department.create(data)
}

const getById = async (id, organizationId) => {
  return await Department.findOne({ where: { id, organizationId } })
}

const update = async (id, organizationId, data, userId) => {
  const department = await getById(id, organizationId)
  if (!department) throw new Error('Department not found')
  return await department.update({ ...data, activeFrom: data.activeFrom || null, activeTo: data.activeTo || null, modifiedBy: userId || null })
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
