const { ApprovalThreshold } = require('../../../../server/models')
const { Op } = require('sequelize')
const { resolvePermissions } = require('../../../../server/middleware/permission')

const list = async ({ docType = '', organizationId } = {}) => {
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (docType) where.docType = docType
  return ApprovalThreshold.findAll({ where, order: [['docType', 'ASC'], ['amount', 'ASC']] })
}

const getById = async (id) => {
  const t = await ApprovalThreshold.findByPk(id)
  if (!t) throw { status: 404, message: 'Approval threshold not found' }
  return t
}

const create = async ({ docType, amount, requiredPermission, notes, userId, organizationId }) => {
  if (!docType)            throw { status: 400, message: 'Document type is required' }
  if (amount == null)      throw { status: 400, message: 'Amount is required' }
  if (!requiredPermission) throw { status: 400, message: 'Required permission is required' }
  return ApprovalThreshold.create({
    docType,
    amount,
    requiredPermission,
    notes: notes || null,
    organizationId: organizationId || null,
    createdBy: userId || null,
    modifiedBy: userId || null,
  })
}

const update = async (id, { amount, requiredPermission, notes }, userId) => {
  const t = await getById(id)
  await t.update({
    ...(amount             !== undefined && { amount }),
    ...(requiredPermission !== undefined && { requiredPermission }),
    ...(notes              !== undefined && { notes: notes || null }),
    modifiedBy: userId || null,
  })
  return t
}

const remove = async (id) => {
  const t = await getById(id)
  await t.destroy()
}

/**
 * Enforce the approval threshold for a given document.
 * Looks up the highest threshold whose amount <= docAmount, and throws 403
 * unless the user has the threshold's required permission (or wildcard).
 */
const enforce = async ({ user, docType, amount, organizationId }) => {
  if (!user) throw { status: 401, message: 'Authenticated user is required' }
  const candidates = await ApprovalThreshold.findAll({
    where: {
      organizationId: organizationId || null,
      dataFlag: { [Op.ne]: 2 },
      docType,
      amount: { [Op.lte]: Number(amount) || 0 },
    },
    order: [['amount', 'DESC']],
  })
  if (!candidates.length) return // no rule applies
  const applicable = candidates[0]
  const perms = await resolvePermissions(user)
  if (perms.has('*') || perms.has(applicable.requiredPermission)) return
  throw {
    status: 403,
    message: `This ${docType.replace('_', ' ')} exceeds the approval threshold (${applicable.amount}). Required permission: "${applicable.requiredPermission}".`,
  }
}

module.exports = { list, getById, create, update, remove, enforce }
