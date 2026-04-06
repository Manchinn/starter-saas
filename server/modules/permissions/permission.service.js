const { Permission } = require('../../models')

const list = () => Permission.findAll({ order: [['group', 'ASC'], ['name', 'ASC']] })

const getById = async (id) => {
  const perm = await Permission.findByPk(id)
  if (!perm) throw { status: 404, message: 'Permission not found' }
  return perm
}

const create = async (data) => {
  const exists = await Permission.findOne({ where: { slug: data.slug } })
  if (exists) throw { status: 409, message: 'Permission slug already exists' }
  return Permission.create({ name: data.name, slug: data.slug, description: data.description, group: data.group || 'general' })
}

const update = async (id, data) => {
  const perm = await Permission.findByPk(id)
  if (!perm) throw { status: 404, message: 'Permission not found' }
  const allowed = ['name', 'description', 'group']
  await perm.update(Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k))))
  return perm
}

const remove = async (id) => {
  const perm = await Permission.findByPk(id)
  if (!perm) throw { status: 404, message: 'Permission not found' }
  await perm.destroy()
}

module.exports = { list, getById, create, update, remove }
