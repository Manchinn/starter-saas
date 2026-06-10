/**
 * Team (staff self-service) service.
 *
 * Lets a tenant manage the login accounts of its own staff — the users whose
 * `organizationId` points at the tenant. Every operation is scoped to the
 * caller's organization key (see core/tenant.orgIdOf) so one tenant can never
 * reach another's staff, and staff are always created as plain `user` accounts
 * (never `admin`). Role assignment reuses the organization service's
 * anti-escalation guard, so a manager can't grant a role carrying permissions
 * they don't already hold.
 */
const { User, Role, Permission, RefreshToken } = require('../../models')
const { Op } = require('sequelize')
const { resolvePermissions } = require('../../middleware/permission')
const orgService = require('../organizations/organization.service')
const billing = require('../billing/billing.service')

// Staff accounts are never system admins — that role is granted only from the
// admin Organizations area, guarded separately.
const STAFF_ROLE = 'user'

const ROLE_BRIEF = { model: Role, as: 'roles', attributes: ['id', 'slug', 'name', 'color'], through: { attributes: [] } }
const STAFF_ATTRS = ['id', 'name', 'email', 'isActive', 'lastLoginAt', 'createdAt']

const briefRole = (r) => ({ id: r.id, slug: r.slug, name: r.name, color: r.color })

// Fetch one staff member, constrained to the caller's org (404 on miss/foreign).
const findScoped = async (orgId, id, opts = {}) => {
  const staff = await User.findOne({ where: { id, organizationId: orgId }, ...opts })
  if (!staff) throw { status: 404, message: 'Staff member not found' }
  return staff
}

const list = async (orgId, { search = '' } = {}) => {
  const where = { organizationId: orgId }
  if (search) {
    where[Op.or] = [
      { name:  { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ]
  }
  return User.findAll({ where, attributes: STAFF_ATTRS, include: [ROLE_BRIEF], order: [['name', 'ASC']] })
}

const getById = async (orgId, id) =>
  findScoped(orgId, id, { attributes: STAFF_ATTRS, include: [ROLE_BRIEF] })

const create = async (orgId, { name, email, password, roleIds = [], isActive = true }, actor) => {
  // Anti-escalation: a manager can only grant roles whose permissions they hold.
  await orgService.assertCanAssignRoles(actor, roleIds)

  const exists = await User.findOne({ where: { email } })
  if (exists) throw { status: 409, message: 'Email already registered' }

  // Adding a staff member consumes a seat — enforce the org's plan limit.
  await billing.assertSeatAvailable(orgId)

  const staff = await User.create({
    name,
    email,
    password,
    role: STAFF_ROLE,
    isActive: isActive !== false,
    organizationId: orgId,
  })

  if (roleIds.length) {
    const roles = await Role.findAll({ where: { id: roleIds } })
    await staff.setRoles(roles)
  }
  return getById(orgId, staff.id)
}

const update = async (orgId, id, data, actor) => {
  const staff = await findScoped(orgId, id)

  const patch = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.isActive !== undefined) {
    // A manager can't lock themselves out of their own account.
    if (data.isActive === false && String(actor?.id) === String(id)) {
      throw { status: 400, message: 'You cannot deactivate your own account.' }
    }
    patch.isActive = !!data.isActive
  }
  if (data.email !== undefined && data.email !== staff.email) {
    const taken = await User.findOne({ where: { email: data.email, id: { [Op.ne]: id } } })
    if (taken) throw { status: 409, message: 'Email already registered' }
    patch.email = data.email
  }

  await staff.update(patch)
  return getById(orgId, id)
}

// Owner/manager-initiated password set. Revokes the staff member's refresh
// tokens so any existing session is forced to re-authenticate.
const setPassword = async (orgId, id, newPassword) => {
  const staff = await findScoped(orgId, id)
  await staff.update({ password: newPassword }) // model hook hashes it
  await RefreshToken.update({ isRevoked: true }, { where: { userId: id, isRevoked: false } })
}

const assignRoles = async (orgId, id, roleIds = [], actor) => {
  await findScoped(orgId, id)
  await orgService.assertCanAssignRoles(actor, roleIds)
  const staff = await User.findOne({ where: { id, organizationId: orgId } })
  const roles = await Role.findAll({ where: { id: roleIds } })
  await staff.setRoles(roles)
  return getById(orgId, id)
}

const remove = async (orgId, id, actor) => {
  if (String(actor?.id) === String(id)) {
    throw { status: 400, message: 'You cannot delete your own account.' }
  }
  const staff = await findScoped(orgId, id)
  await staff.destroy()
}

// Roles a manager is allowed to assign: those whose permissions are a subset of
// the manager's own (admins/wildcard may assign any). Drives the create/edit UI.
const assignableRoles = async (actor) => {
  const roles = await Role.findAll({
    attributes: ['id', 'slug', 'name', 'color'],
    include: [{ model: Permission, as: 'permissions', attributes: ['slug'] }],
    order: [['name', 'ASC']],
  })
  if (actor?.role === 'admin') return roles.map(briefRole)
  const perms = await resolvePermissions(actor)
  if (perms.has('*')) return roles.map(briefRole)
  return roles
    .filter((r) => (r.permissions || []).every((p) => perms.has(p.slug)))
    .map(briefRole)
}

module.exports = { list, getById, create, update, setPassword, assignRoles, remove, assignableRoles }
