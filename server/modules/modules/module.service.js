const { Module } = require('../../models')

const list = async () => {
  return Module.findAll({ order: [['order', 'ASC'], ['name', 'ASC']] })
}

const getById = async (id) => {
  const mod = await Module.findByPk(id)
  if (!mod) throw { status: 404, message: 'Module not found' }
  return mod
}

const create = async (data) => {
  const exists = await Module.findOne({ where: { slug: data.slug } })
  if (exists) throw { status: 409, message: 'Module slug already exists' }
  return Module.create(data)
}

const update = async (id, data) => {
  const mod = await Module.findByPk(id)
  if (!mod) throw { status: 404, message: 'Module not found' }
  if (mod.isCore && data.isActive === false) {
    throw { status: 400, message: 'Core modules cannot be deactivated' }
  }
  const allowed = ['name', 'description', 'icon', 'order', 'isActive', 'permissions', 'meta']
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  await mod.update(filtered)
  return mod
}

const toggle = async (id) => {
  const mod = await Module.findByPk(id)
  if (!mod) throw { status: 404, message: 'Module not found' }
  if (mod.isCore) throw { status: 400, message: 'Core modules cannot be toggled' }
  await mod.update({ isActive: !mod.isActive })
  return mod
}

const remove = async (id) => {
  const mod = await Module.findByPk(id)
  if (!mod) throw { status: 404, message: 'Module not found' }
  if (mod.isCore) throw { status: 400, message: 'Core modules cannot be deleted' }
  await mod.destroy()
}

module.exports = { list, getById, create, update, toggle, remove }
