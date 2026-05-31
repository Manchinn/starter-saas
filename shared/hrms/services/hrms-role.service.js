const { HrmsRole, HrmsPermission, Employee } = require('../../../server/models')

const slugify = (s) => String(s || '')
  .trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const withPermissions = {
  include: [{ model: HrmsPermission, as: 'permissions', attributes: ['id', 'slug', 'name', 'group', 'module'] }],
}

const list = async (organizationId) => {
  const roles = await HrmsRole.findAll({
    where: { organizationId },
    include: [
      { model: HrmsPermission, as: 'permissions', attributes: ['id', 'slug', 'name', 'group'] },
      { model: Employee, as: 'employees', attributes: ['id'], through: { attributes: [] } },
    ],
    order: [['name', 'ASC']],
  })
  return roles.map((r) => {
    const json = r.toJSON()
    json.employeeCount   = json.employees?.length || 0
    json.permissionCount = json.permissions?.length || 0
    delete json.employees
    return json
  })
}

const getById = async (id, organizationId) => {
  const role = await HrmsRole.findOne({ where: { id, organizationId }, ...withPermissions })
  if (!role) throw { status: 404, message: 'Role not found' }
  return role
}

const create = async (organizationId, data, createdBy) => {
  const slug = slugify(data.slug || data.name)
  if (!slug) throw { status: 400, message: 'A name or slug is required' }
  const exists = await HrmsRole.findOne({ where: { organizationId, slug } })
  if (exists) throw { status: 409, message: 'A role with this slug already exists' }
  return HrmsRole.create({
    organizationId,
    name: data.name,
    slug,
    description: data.description || null,
    color: data.color || '#6366f1',
    createdBy: createdBy || null,
  })
}

const update = async (id, organizationId, data, modifiedBy) => {
  const role = await HrmsRole.findOne({ where: { id, organizationId } })
  if (!role) throw { status: 404, message: 'Role not found' }
  const allowed = ['name', 'description', 'color']
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
  await role.update({ ...filtered, modifiedBy: modifiedBy || null })
  return getById(id, organizationId)
}

const remove = async (id, organizationId) => {
  const role = await HrmsRole.findOne({ where: { id, organizationId } })
  if (!role) throw { status: 404, message: 'Role not found' }
  if (role.isSystem) throw { status: 400, message: 'System roles cannot be deleted' }
  await role.destroy()
}

const assignPermissions = async (id, organizationId, permissionIds) => {
  const role = await HrmsRole.findOne({ where: { id, organizationId } })
  if (!role) throw { status: 404, message: 'Role not found' }
  const perms = await HrmsPermission.findAll({ where: { id: permissionIds } })
  await role.setPermissions(perms)
  return getById(id, organizationId)
}

module.exports = { list, getById, create, update, remove, assignPermissions }
