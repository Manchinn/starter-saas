const { User, Module, Role, Permission } = require('../../models')
const { Op } = require('sequelize')

const organizationIncludes = [
  { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
  {
    model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'],
    include: [
      { model: Permission, as: 'permissions', attributes: ['id', 'slug', 'name'] },
      { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
    ],
  },
  { model: User, as: 'parent',   attributes: ['id', 'name', 'email'] },
  { model: User, as: 'children', attributes: ['id', 'name', 'email', 'isActive'] },
]

const create = async ({ name, email, password, role = 'user', defaultPage = null, roleIds = [], organizationId = null, parentId = null }) => {
  const exists = await User.findOne({ where: { email } })
  if (exists) throw { status: 409, message: 'Email already registered' }

  const organization = await User.create({ name, email, password, role, defaultPage, organizationId, parentId: parentId || null })

  if (roleIds.length) {
    const roles = await Role.findAll({ where: { id: roleIds } })
    await organization.setRoles(roles)
  } else {
    // assign default viewer role
    const viewer = await Role.findOne({ where: { slug: 'viewer' } })
    if (viewer) await organization.setRoles([viewer])
  }

  return getById(organization.id)
}

const list = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit
  const where = {
    organizationId: null, // Only top-level organizations
    ...(search && {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ],
    }),
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'] },
      { model: User, as: 'parent', attributes: ['id', 'name'] },
    ],
  })

  return { total: count, page, limit, organizations: rows }
}

const getById = async (id) => {
  const organization = await User.findByPk(id, { include: organizationIncludes })
  if (!organization) throw { status: 404, message: 'Organization not found' }
  return organization
}

const update = async (id, data) => {
  const organization = await User.findByPk(id)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  const allowed = ['name', 'role', 'isActive', 'defaultPage', 'parentId']
  const patch = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  if ('parentId' in patch) patch.parentId = patch.parentId || null
  await organization.update(patch)
  return User.findByPk(id, { include: [{ model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'] }, { model: User, as: 'parent', attributes: ['id', 'name'] }] })
}

const remove = async (id) => {
  const organization = await User.findByPk(id)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  await organization.destroy()
}

const assignModules = async (organizationId, moduleIds) => {
  const organization = await User.findByPk(organizationId)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  const modules = await Module.findAll({ where: { id: moduleIds } })
  await organization.setModules(modules)
  return getById(organizationId)
}

const assignRoles = async (organizationId, roleIds) => {
  const organization = await User.findByPk(organizationId)
  if (!organization) throw { status: 404, message: 'Organization not found' }
  const roles = await Role.findAll({ where: { id: roleIds } })
  await organization.setRoles(roles)
  return getById(organizationId)
}

const getUserPermissions = async (organizationId) => {
  const organization = await User.findByPk(organizationId, {
    include: [{
      model: Role, as: 'roles',
      include: [{ model: Permission, as: 'permissions' }],
    }],
  })
  if (!organization) throw { status: 404, message: 'Organization not found' }
  if (organization.role === 'admin') return { isAdmin: true, permissions: ['*'] }
  const perms = [...new Set(organization.roles.flatMap((r) => r.permissions.map((p) => p.slug)))]
  return { isAdmin: false, permissions: perms }
}

// Returns merged list of modules: directly assigned to user + granted via user's roles
const getMyModules = async (organizationId) => {
  const organization = await User.findByPk(organizationId, {
    include: [
      { model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] },
      {
        model: Role, as: 'roles',
        include: [{ model: Module, as: 'modules', attributes: ['id', 'slug', 'name', 'icon', 'isActive'] }],
      },
    ],
  })
  if (!organization) throw { status: 404, message: 'Organization not found' }

  const seen = new Set()
  const merged = []
  for (const m of [
    ...organization.modules,
    ...organization.roles.flatMap((r) => r.modules),
  ]) {
    if (!seen.has(m.id)) {
      seen.add(m.id)
      merged.push(m)
    }
  }
  return merged
}

const getStaff = async (organizationId, search = '') => {
  const where = { organizationId }
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ]
  }
  return User.findAll({
    where,
    attributes: ['id', 'name', 'email', 'role', 'isActive'],
    order: [['name', 'ASC']],
  })
}

const listAllStaff = async ({ page = 1, limit = 20, search = '', organizationId = null }) => {
  const offset = (page - 1) * limit
  const where = {
    organizationId: organizationId ? organizationId : { [Op.ne]: null }, // Filter by specific org OR all staff
    ...(search && {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ],
    }),
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    attributes: ['id', 'name', 'email', 'role', 'isActive', 'organizationId'],
    include: [
      { model: User, as: 'organization', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, staff: rows }
}

const listAll = async () => {
  return User.findAll({
    where: { organizationId: null },
    attributes: ['id', 'name', 'email'],
    order: [['name', 'ASC']],
  })
}

module.exports = { create, list, getById, update, remove, assignModules, assignRoles, getUserPermissions, getMyModules, getStaff, listAllStaff, listAll }
