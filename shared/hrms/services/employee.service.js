const { sequelize, Employee, User, UserRole, RefreshToken, Department, Role, Permission } = require('../../../server/models')
const { Op } = require('sequelize')
const seqService  = require('../../erp/settings/services/sequence.service')
const auditService = require('../../erp/audit/audit.service')
const organizationService = require('../../../server/modules/organizations/organization.service')
const { resolvePermissions } = require('../../../server/middleware/permission')
const realtime = require('../../../server/core/realtime')

const USER_ATTRS = ['id', 'name', 'email', 'isActive', 'role', 'lastLoginAt']
const USER_INCLUDE = {
  model: User,
  as: 'user',
  attributes: USER_ATTRS,
  include: [{ model: Role, as: 'roles', attributes: ['id', 'name', 'slug', 'color'], through: { attributes: [] } }],
}
const ROLE_INCLUDE = [{ model: Permission, as: 'permissions', attributes: ['slug'], through: { attributes: [] } }]

async function assertAssignableRoles(roleIds = [], actor, transaction) {
  if (!roleIds.length) return
  const query = { where: { id: roleIds }, include: ROLE_INCLUDE }
  if (transaction) query.transaction = transaction
  const roles = await Role.findAll(query)
  if (roles.length !== roleIds.length) throw { status: 400, message: 'One or more roles do not exist' }
  if (!actor || actor.role === 'admin') return
  const actorPermissions = await resolvePermissions(actor)
  for (const role of roles) {
    if ((role.permissions || []).some((permission) => !actorPermissions.has(permission.slug))) {
      throw { status: 403, message: `You cannot assign the "${role.name}" role because it grants permissions you do not have.` }
    }
  }
}

async function listAssignableRoles(actor) {
  const roles = await Role.findAll({
    attributes: ['id', 'name', 'slug', 'color'],
    include: ROLE_INCLUDE,
    order: [['name', 'ASC']],
  })
  if (!actor || actor.role === 'admin') return roles.map((role) => role.toJSON ? role.toJSON() : role)
  const actorPermissions = await resolvePermissions(actor)
  return roles
    .filter((role) => (role.permissions || []).every((permission) => actorPermissions.has(permission.slug)))
    .map((role) => role.toJSON ? role.toJSON() : role)
}

function assertUserBelongsToOrganization(user, organizationId) {
  if (user.organizationId !== organizationId) {
    throw { status: 403, message: 'Selected user account belongs to a different organization' }
  }
}

const list = async ({ organizationId, page = 1, limit = 20, search = '', status = '', activeFrom = '', activeTo = '' }) => {
  if (!organizationId) throw { status: 400, message: 'Organization ID is required' }
  const offset = (page - 1) * limit
  const where  = { organizationId, dataFlag: { [Op.ne]: 2 } }
  if (status) where.status = status
  if (activeFrom) where.activeFrom = { [Op.gte]: activeFrom }
  if (activeTo) where.activeTo = { [Op.lte]: activeTo }
  if (search) {
    where[Op.or] = [
      { firstName:    { [Op.like]: `%${search}%` } },
      { lastName:     { [Op.like]: `%${search}%` } },
      { employeeCode: { [Op.like]: `%${search}%` } },
      { position:     { [Op.like]: `%${search}%` } },
    ]
  }

  const { count, rows } = await Employee.findAndCountAll({
    where,
    include: [
      USER_INCLUDE,
      { model: Department, as: 'departments', through: { attributes: [] } },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })
  return { total: count, page, limit, employees: rows }
}

const getById = async (id, organizationId) => {
  const where = { id }
  if (organizationId) where.organizationId = organizationId
  
  const emp = await Employee.findOne({
    where,
    include: [
      USER_INCLUDE,
      { model: Department, as: 'departments', through: { attributes: [] } },
    ],
  })
  if (!emp) throw { status: 404, message: 'Employee not found' }
  return emp
}

const create = async ({ firstName, lastName, position, phone, startDate, status = 'active',
  activeFrom, activeTo,
  employeeCode, autoCode, userId, email, password, credentialMode = 'existing', createdByUserId, organizationId, departmentIds, roleIds = [], actor }) => {
  if (!organizationId) throw { status: 400, message: 'Organization ID is required' }
  if (!firstName?.trim()) throw { status: 400, message: 'First name is required' }
  if (!lastName?.trim())  throw { status: 400, message: 'Last name is required' }

  let resolvedUserId = userId || null
  const normalizedRoleIds = Array.isArray(roleIds) ? roleIds : []
  await assertAssignableRoles(normalizedRoleIds, actor)

  if (credentialMode === 'new') {
    // Create a brand-new User account
    if (!email?.trim()) throw { status: 400, message: 'Email is required' }
    if (!password)      throw { status: 400, message: 'Password is required' }
    const newUser = await organizationService.create({
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      password,
      role: 'user',
      roleIds: normalizedRoleIds,
      organizationId: organizationId, // Link staff user to the organization
    }, actor)
    resolvedUserId = newUser.id
  } else if (resolvedUserId) {
    const userExists = await User.findByPk(resolvedUserId)
    if (!userExists) throw { status: 404, message: 'Selected user account not found' }
    assertUserBelongsToOrganization(userExists, organizationId)
    
    // Check if the user is already linked
    const already = await Employee.findOne({ where: { userId: resolvedUserId } })
    if (already) throw { status: 409, message: 'This user account is already linked to another employee' }
  }

  let code = null
  if (autoCode) {
    code = await seqService.getNext('EMP', createdByUserId)
  } else if (employeeCode?.trim()) {
    code = employeeCode.trim()
  }

  const emp = await Employee.create({
    employeeCode: code,
    firstName:  firstName.trim(),
    lastName:   lastName.trim(),
    position:   position?.trim()   || null,
    phone:      phone?.trim()      || null,
    startDate:  startDate          || null,
    status,
    activeFrom: activeFrom || null,
    activeTo:   activeTo   || null,
    userId:         resolvedUserId,
    organizationId: organizationId,
    createdBy:      createdByUserId || null,
  })

  if (departmentIds && departmentIds.length) {
    await emp.setDepartments(departmentIds)
  }
  if (resolvedUserId && credentialMode !== 'new' && normalizedRoleIds.length) {
    await organizationService.assignRoles(resolvedUserId, normalizedRoleIds, actor)
  }

  return getById(emp.id)
}

const update = async (id, payload, organizationId, modifiedByUserId, actor) => {
  const { firstName, lastName, position, phone, startDate, status,
    activeFrom, activeTo, employeeCode, userId, organizationId: newOrgId, departmentIds, roleIds } = payload
  await sequelize.transaction(async (transaction) => {
    const emp = await Employee.findOne({ where: { id, organizationId }, transaction })
    if (!emp) throw { status: 404, message: 'Employee not found' }

    const resultingUserId = userId !== undefined ? userId || null : emp.userId
    if (status === 'terminated' && (emp.userId || resultingUserId)) {
      throw { status: 400, message: 'Use offboarding to terminate an employee with a linked login account' }
    }

    if (userId && userId !== emp.userId) {
      const userExists = await User.findByPk(userId, { transaction })
      if (!userExists) throw { status: 404, message: 'Selected user not found' }
      assertUserBelongsToOrganization(userExists, organizationId)
      const already = await Employee.findOne({ where: { userId, id: { [Op.ne]: id } }, transaction })
      if (already) throw { status: 409, message: 'This user already has an employee record' }
    }

    await emp.update({
      ...(firstName    !== undefined && { firstName:    firstName.trim() }),
      ...(lastName     !== undefined && { lastName:     lastName.trim() }),
      ...(position     !== undefined && { position:     position?.trim()   || null }),
      ...(phone        !== undefined && { phone:        phone?.trim()      || null }),
      ...(startDate    !== undefined && { startDate:    startDate || null }),
      ...(status       !== undefined && { status }),
      ...(activeFrom   !== undefined && { activeFrom: activeFrom || null }),
      ...(activeTo     !== undefined && { activeTo: activeTo || null }),
      ...(employeeCode !== undefined && { employeeCode: employeeCode?.trim() || null }),
      ...(userId       !== undefined && { userId:       userId || null }),
      ...(newOrgId     !== undefined && newOrgId && { organizationId: newOrgId }),
      modifiedBy: modifiedByUserId || null,
    }, { transaction })

    if (departmentIds !== undefined) {
      await emp.setDepartments(departmentIds || [], { transaction })
    }
    if (roleIds !== undefined) {
      const normalizedRoleIds = Array.isArray(roleIds) ? [...new Set(roleIds)] : []
      const linkedUserId = resultingUserId
      if (linkedUserId) {
        await assertAssignableRoles(normalizedRoleIds, actor, transaction)
        const previousRoleLinks = await UserRole.findAll({
          where: { userId: linkedUserId },
          attributes: ['roleId'],
          transaction,
        }) || []
        const previousRoleIds = previousRoleLinks.map((link) => link.roleId)
        await organizationService.assignRoles(linkedUserId, normalizedRoleIds, actor, { transaction })
        const before = [...previousRoleIds].sort()
        const after = [...normalizedRoleIds].sort()
        if (JSON.stringify(before) !== JSON.stringify(after)) {
          await auditService.logStrict({
            user: actor,
            userId: modifiedByUserId,
            action: 'hrms.employee.access.roles_changed',
            entityType: 'Employee',
            entityId: id,
            organizationId,
            summary: { targetUserId: linkedUserId, previousRoleIds, roleIds: normalizedRoleIds },
          }, { transaction })
        }
      } else if (normalizedRoleIds.length) {
        throw { status: 400, message: 'Assign a login account before assigning roles' }
      }
    }
  })

  return getById(id)
}

const remove = async (id, organizationId) => {
  const emp = await Employee.findOne({ where: { id, organizationId } })
  if (!emp) throw { status: 404, message: 'Employee not found' }
  await emp.destroy()
}

const offboard = async (id, organizationId, modifiedByUserId, actor, activeTo) => {
  let result

  await sequelize.transaction(async (transaction) => {
    const emp = await Employee.findOne({ where: { id, organizationId }, transaction })
    if (!emp) throw { status: 404, message: 'Employee not found' }
    if (!emp.userId) throw { status: 400, message: 'Employee has no linked login account' }
    if (actor?.id === emp.userId) throw { status: 400, message: 'You cannot offboard your own account' }

    const user = await User.findByPk(emp.userId, { transaction })
    if (!user) throw { status: 404, message: 'Linked user account not found' }
    assertUserBelongsToOrganization(user, organizationId)

    const roleLinks = await UserRole.findAll({
      where: { userId: user.id },
      attributes: ['roleId'],
      transaction,
    })
    const revokedRoleIds = roleLinks.map((link) => link.roleId)

    await user.update({ isActive: false }, { transaction })
    const revokedRoles = await UserRole.destroy({ where: { userId: user.id }, transaction })
    const [revokedSessions] = await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: user.id, isRevoked: false }, transaction },
    )
    await emp.update({
      status: 'terminated',
      activeTo: activeTo || new Date().toISOString().slice(0, 10),
      modifiedBy: modifiedByUserId || null,
    }, { transaction })

    const auditSummary = {
      targetUserId: user.id,
      revokedRoleIds,
      revokedRoles,
      revokedSessions,
    }
    result = { employeeId: emp.id, userId: user.id, revokedRoles, revokedSessions }
    await auditService.logStrict({
      user: actor,
      userId: modifiedByUserId,
      action: 'hrms.employee.access.offboarded',
      entityType: 'Employee',
      entityId: id,
      organizationId,
      summary: auditSummary,
    }, { transaction })
  })

  realtime.disconnectUser(result.userId)

  return result
}

const listAccessHistory = async (id, organizationId, { page = 1, limit = 20 } = {}) => {
  const emp = await Employee.findOne({ where: { id, organizationId }, attributes: ['id'] })
  if (!emp) throw { status: 404, message: 'Employee not found' }

  return auditService.list({
    page,
    limit,
    entityType: 'Employee',
    entityId: id,
    action: 'hrms.employee.access.',
    organizationId,
  })
}

module.exports = { list, getById, create, update, remove, offboard, listAccessHistory, listAssignableRoles }
