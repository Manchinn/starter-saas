const { Employee, User, Department, HrmsRole, HrmsPermission, RefreshToken } = require('../../../server/models')
const { Op } = require('sequelize')
const seqService  = require('../../erp/settings/services/sequence.service')
const organizationService = require('../../../server/modules/organizations/organization.service')

const USER_ATTRS = ['id', 'name', 'email', 'isActive', 'role', 'lastLoginAt']

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
      { model: User, as: 'user', attributes: USER_ATTRS },
      { model: Department, as: 'departments', through: { attributes: [] } },
      {
        model: HrmsRole, as: 'roles', attributes: ['id', 'name', 'color'], through: { attributes: [] },
        include: [{ model: HrmsPermission, as: 'permissions', attributes: ['slug', 'name'], through: { attributes: [] } }],
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  })
  return { total: count, page, limit, employees: rows }
}

const getById = async (id, organizationId) => {
  const where = { id }
  if (organizationId) where.organizationId = organizationId

  const emp = await Employee.findOne({
    where,
    include: [
      { model: User, as: 'user', attributes: USER_ATTRS },
      { model: Department, as: 'departments', through: { attributes: [] } },
      { model: HrmsRole, as: 'roles', attributes: ['id', 'name', 'color'], through: { attributes: [] } },
    ],
  })
  if (!emp) throw { status: 404, message: 'Employee not found' }
  return emp
}

// Create the login account for an employee inline (no linking to an existing
// account). Reuses the organization service so seat limits and the staff-user
// wiring (role 'user' + organizationId) are enforced exactly as elsewhere.
const createLoginAccount = async ({ name, email, password, organizationId }) => {
  if (!email?.trim()) throw { status: 400, message: 'Email is required' }
  if (!password)      throw { status: 400, message: 'Password is required' }
  if (String(password).length < 8) throw { status: 400, message: 'Password must be at least 8 characters' }
  const user = await organizationService.create({
    name,
    email: email.trim(),
    password,
    role: 'user',
    organizationId,
  })
  return user.id
}

const create = async ({ firstName, lastName, position, phone, startDate, status = 'active',
  activeFrom, activeTo, employeeCode, autoCode, account,
  createdByUserId, organizationId, departmentIds, roleIds }) => {
  if (!organizationId) throw { status: 400, message: 'Organization ID is required' }
  if (!firstName?.trim()) throw { status: 400, message: 'First name is required' }
  if (!lastName?.trim())  throw { status: 400, message: 'Last name is required' }

  const fullName = `${firstName.trim()} ${lastName.trim()}`

  // Optionally provision a login account for this employee.
  let resolvedUserId = null
  if (account?.create) {
    resolvedUserId = await createLoginAccount({
      name: fullName, email: account.email, password: account.password, organizationId,
    })
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

  if (roleIds && roleIds.length) {
    const roles = await HrmsRole.findAll({ where: { id: roleIds, organizationId } })
    await emp.setRoles(roles)
  }

  return getById(emp.id)
}

// Apply inline login-account changes for an employee on update. Handles three
// cases: create a login when none exists yet, edit the linked account's
// email/active flag, and reset its password (which revokes its sessions).
const applyAccountChanges = async (emp, account, organizationId, fullName) => {
  if (!account) return

  // No login yet → optionally create one.
  if (!emp.userId) {
    if (account.create) {
      const userId = await createLoginAccount({
        name: fullName, email: account.email, password: account.password, organizationId,
      })
      await emp.update({ userId })
    }
    return
  }

  // Existing login → edit in place. Scope the lookup to the org so a tampered
  // userId can never reach another tenant's account.
  const user = await User.findOne({ where: { id: emp.userId, organizationId } })
  if (!user) return

  const patch = {}
  if (account.email !== undefined && account.email.trim() && account.email.trim() !== user.email) {
    const taken = await User.findOne({ where: { email: account.email.trim(), id: { [Op.ne]: user.id } } })
    if (taken) throw { status: 409, message: 'Email already registered' }
    patch.email = account.email.trim()
  }
  if (account.isActive !== undefined) patch.isActive = !!account.isActive
  if (fullName && fullName !== user.name) patch.name = fullName
  if (Object.keys(patch).length) await user.update(patch)

  if (account.newPassword) {
    if (String(account.newPassword).length < 8) {
      throw { status: 400, message: 'Password must be at least 8 characters' }
    }
    await user.update({ password: account.newPassword }) // model hook hashes it
    await RefreshToken.update({ isRevoked: true }, { where: { userId: user.id, isRevoked: false } })
  }
}

const update = async (id, payload, organizationId, modifiedByUserId) => {
  const { firstName, lastName, position, phone, startDate, status,
    activeFrom, activeTo, employeeCode, organizationId: newOrgId,
    departmentIds, roleIds, account } = payload
  const emp = await Employee.findOne({ where: { id, organizationId } })
  if (!emp) throw { status: 404, message: 'Employee not found' }

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
    ...(newOrgId     !== undefined && newOrgId && { organizationId: newOrgId }),
    modifiedBy: modifiedByUserId || null,
  })

  // Login-account changes (create / edit email+active / reset password). Use the
  // employee's resulting name so the account name tracks the employee.
  const fullName = `${emp.firstName} ${emp.lastName}`
  await applyAccountChanges(emp, account, organizationId, fullName)

  if (departmentIds !== undefined) {
    await emp.setDepartments(departmentIds || [])
  }

  if (roleIds !== undefined) {
    const roles = await HrmsRole.findAll({ where: { id: roleIds || [], organizationId } })
    await emp.setRoles(roles)
  }

  return getById(id)
}

const remove = async (id, organizationId) => {
  const emp = await Employee.findOne({ where: { id, organizationId } })
  if (!emp) throw { status: 404, message: 'Employee not found' }
  await emp.destroy()
}

module.exports = { list, getById, create, update, remove }
