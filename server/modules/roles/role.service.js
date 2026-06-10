const { Role, Permission, Module, User } = require('../../models')

const withAll = {
  include: [
    { model: Permission, as: 'permissions', attributes: ['id', 'slug', 'name', 'group'] },
    { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
  ],
}

const list = async () => {
  const roles = await Role.findAll({
    include: [
      { model: Permission, as: 'permissions', attributes: ['id', 'slug', 'name', 'group'] },
      { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
      { model: User, as: 'users', attributes: ['id'], through: { attributes: [] } },
    ],
    order: [['name', 'DESC']],
  })
  return roles.map((r) => {
    const json = r.toJSON()
    json.userCount       = json.users?.length || 0
    json.permissionCount = json.permissions?.length || 0
    json.moduleCount     = json.modules?.length || 0
    delete json.users
    return json
  })
}

const getById = async (id) => {
  const role = await Role.findByPk(id, withAll)
  if (!role) throw { status: 404, message: 'Role not found' }
  return role
}

const create = async (data) => {
  const exists = await Role.findOne({ where: { slug: data.slug } })
  if (exists) throw { status: 409, message: 'Role slug already exists' }
  return Role.create({ name: data.name, slug: data.slug, description: data.description, color: data.color })
}

const update = async (id, data) => {
  const role = await Role.findByPk(id)
  if (!role) throw { status: 404, message: 'Role not found' }
  const allowed = ['name', 'description', 'color']
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  await role.update(filtered)
  return role
}

const remove = async (id) => {
  const role = await Role.findByPk(id)
  if (!role) throw { status: 404, message: 'Role not found' }
  if (role.isSystem) throw { status: 400, message: 'System roles cannot be deleted' }
  await role.destroy()
}

const assignPermissions = async (id, permissionIds) => {
  const role = await Role.findByPk(id)
  if (!role) throw { status: 404, message: 'Role not found' }
  const perms = await Permission.findAll({ where: { id: permissionIds } })
  await role.setPermissions(perms)
  return getById(id)
}

const assignModules = async (id, moduleIds) => {
  const role = await Role.findByPk(id)
  if (!role) throw { status: 404, message: 'Role not found' }
  const modules = await Module.findAll({ where: { id: moduleIds } })
  await role.setModules(modules)
  return getById(id)
}

module.exports = { list, getById, create, update, remove, assignPermissions, assignModules }
