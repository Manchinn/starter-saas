const { User, Module, Role, Permission } = require('../../models')
const { Op } = require('sequelize')

const userIncludes = [
  { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
  {
    model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'],
    include: [
      { model: Permission, as: 'permissions', attributes: ['id', 'slug', 'name'] },
      { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
    ],
  },
]

const create = async ({ name, email, password, role = 'user', roleIds = [] }) => {
  const exists = await User.findOne({ where: { email } })
  if (exists) throw { status: 409, message: 'Email already registered' }

  const user = await User.create({ name, email, password, role })

  if (roleIds.length) {
    const roles = await Role.findAll({ where: { id: roleIds } })
    await user.setRoles(roles)
  } else {
    // assign default viewer role
    const viewer = await Role.findOne({ where: { slug: 'viewer' } })
    if (viewer) await user.setRoles([viewer])
  }

  return getById(user.id)
}

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = search
    ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }] }
    : {}

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'] },
    ],
  })

  return { total: count, page, limit, users: rows }
}

const getById = async (id) => {
  const user = await User.findByPk(id, { include: userIncludes })
  if (!user) throw { status: 404, message: 'User not found' }
  return user
}

const update = async (id, data) => {
  const user = await User.findByPk(id)
  if (!user) throw { status: 404, message: 'User not found' }
  const allowed = ['name', 'role', 'isActive']
  await user.update(Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k))))
  return User.findByPk(id, { include: [{ model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'] }] })
}

const remove = async (id) => {
  const user = await User.findByPk(id)
  if (!user) throw { status: 404, message: 'User not found' }
  await user.destroy()
}

const assignModules = async (userId, moduleIds) => {
  const user = await User.findByPk(userId)
  if (!user) throw { status: 404, message: 'User not found' }
  const modules = await Module.findAll({ where: { id: moduleIds } })
  await user.setModules(modules)
  return getById(userId)
}

const assignRoles = async (userId, roleIds) => {
  const user = await User.findByPk(userId)
  if (!user) throw { status: 404, message: 'User not found' }
  const roles = await Role.findAll({ where: { id: roleIds } })
  await user.setRoles(roles)
  return getById(userId)
}

const getUserPermissions = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{
      model: Role, as: 'roles',
      include: [{ model: Permission, as: 'permissions' }],
    }],
  })
  if (!user) throw { status: 404, message: 'User not found' }
  if (user.role === 'admin') return { isAdmin: true, permissions: ['*'] }
  const perms = [...new Set(user.roles.flatMap((r) => r.permissions.map((p) => p.slug)))]
  return { isAdmin: false, permissions: perms }
}

// Returns merged list of modules: directly assigned to user + granted via user's roles
const getMyModules = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
      {
        model: Role, as: 'roles',
        include: [{ model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] }],
      },
    ],
  })
  if (!user) throw { status: 404, message: 'User not found' }

  const seen = new Set()
  const merged = []
  for (const m of [
    ...user.modules,
    ...user.roles.flatMap((r) => r.modules),
  ]) {
    if (!seen.has(m.id)) {
      seen.add(m.id)
      merged.push(m)
    }
  }
  return merged
}

module.exports = { create, list, getById, update, remove, assignModules, assignRoles, getUserPermissions, getMyModules }
