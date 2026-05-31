const { Employee, User, Department, HrmsRole } = require('../../../server/models')
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
      { model: HrmsRole, as: 'roles', attributes: ['id', 'name', 'color'], through: { attributes: [] } },
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
      { model: User, as: 'user', attributes: USER_ATTRS },
      { model: Department, as: 'departments', through: { attributes: [] } },
      { model: HrmsRole, as: 'roles', attributes: ['id', 'name', 'color'], through: { attributes: [] } },
    ],
  })
  if (!emp) throw { status: 404, message: 'Employee not found' }
  return emp
}

const create = async ({ firstName, lastName, position, phone, startDate, status = 'active',
  activeFrom, activeTo,
  employeeCode, autoCode, userId, email, password, credentialMode = 'existing', createdByUserId, organizationId, departmentIds, roleIds }) => {
  if (!organizationId) throw { status: 400, message: 'Organization ID is required' }
  if (!firstName?.trim()) throw { status: 400, message: 'First name is required' }
  if (!lastName?.trim())  throw { status: 400, message: 'Last name is required' }

  let resolvedUserId = userId || null

  if (credentialMode === 'new') {
    // Create a brand-new User account
    if (!email?.trim()) throw { status: 400, message: 'Email is required' }
    if (!password)      throw { status: 400, message: 'Password is required' }
    const newUser = await organizationService.create({
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      password,
      role: 'user',
      organizationId: organizationId, // Link staff user to the organization
    })
    resolvedUserId = newUser.id
  } else if (resolvedUserId) {
    const userExists = await User.findByPk(resolvedUserId)
    if (!userExists) throw { status: 404, message: 'Selected user account not found' }
    
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

  if (roleIds && roleIds.length) {
    const roles = await HrmsRole.findAll({ where: { id: roleIds, organizationId } })
    await emp.setRoles(roles)
  }

  return getById(emp.id)
}

const update = async (id, payload, organizationId, modifiedByUserId) => {
  const { firstName, lastName, position, phone, startDate, status,
    activeFrom, activeTo,
    employeeCode, userId, organizationId: newOrgId, departmentIds, roleIds } = payload
  const emp = await Employee.findOne({ where: { id, organizationId } })
  if (!emp) throw { status: 404, message: 'Employee not found' }

  if (userId && userId !== emp.userId) {
    const userExists = await User.findByPk(userId)
    if (!userExists) throw { status: 404, message: 'Selected user not found' }
    const already = await Employee.findOne({ where: { userId, id: { [Op.ne]: id } } })
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
  })

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
