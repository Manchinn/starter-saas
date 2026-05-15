const { ChartOfAccount } = require('../../../../server/models')
const { Op } = require('sequelize')

const normalBalanceFor = {
  asset:     'debit',
  expense:   'debit',
  liability: 'credit',
  equity:    'credit',
  revenue:   'credit',
}

const list = async ({ page = 1, limit = 20, search = '', accountType = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) {
    where[Op.or] = [
      { code: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
    ]
  }
  if (accountType) where.accountType = accountType
  if (status) where.status = status

  const { count, rows } = await ChartOfAccount.findAndCountAll({
    where,
    include: [{ model: ChartOfAccount, as: 'parent', attributes: ['id', 'code', 'name'] }],
    limit,
    offset,
    order: [['code', 'ASC']],
  })

  return { total: count, page, limit, accounts: rows }
}

const listAll = async (organizationId) => {
  const accounts = await ChartOfAccount.findAll({
    where: { organizationId: organizationId || null, status: 'active', dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'code', 'name', 'accountType', 'level'],
    order: [['code', 'ASC']],
  })
  return accounts
}

const getById = async (id) => {
  const account = await ChartOfAccount.findByPk(id, {
    include: [{ model: ChartOfAccount, as: 'parent', attributes: ['id', 'code', 'name'] }],
  })
  if (!account) throw { status: 404, message: 'Account not found' }
  return account
}

const create = async ({ code, name, accountType, normalBalance, description, parentId, status = 'active', userId, organizationId }) => {
  if (!code?.trim()) throw { status: 400, message: 'Account code is required' }
  if (!name?.trim()) throw { status: 400, message: 'Account name is required' }
  if (!accountType) throw { status: 400, message: 'Account type is required' }

  const existing = await ChartOfAccount.findOne({ where: { code: code.trim(), organizationId: organizationId || null } })
  if (existing) throw { status: 400, message: 'Account code already exists' }

  let level = 1
  if (parentId) {
    const parent = await ChartOfAccount.findByPk(parentId)
    if (!parent) throw { status: 400, message: 'Parent account not found' }
    level = parent.level + 1
  }

  const resolvedBalance = normalBalance || normalBalanceFor[accountType] || 'debit'

  return ChartOfAccount.create({
    code: code.trim(),
    name: name.trim(),
    accountType,
    normalBalance: resolvedBalance,
    description: description || null,
    parentId: parentId || null,
    level,
    status,
    organizationId: organizationId || null,
    createdBy: userId || null,
    modifiedBy: userId || null,
  })
}

const update = async (id, data, userId) => {
  const account = await ChartOfAccount.findByPk(id)
  if (!account) throw { status: 404, message: 'Account not found' }

  if (data.code && data.code !== account.code) {
    const existing = await ChartOfAccount.findOne({
      where: { code: data.code.trim(), organizationId: account.organizationId, id: { [Op.ne]: id } },
    })
    if (existing) throw { status: 400, message: 'Account code already exists' }
  }

  const allowed = ['code', 'name', 'accountType', 'normalBalance', 'description', 'parentId', 'status']
  const patch = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k) && data[k] !== undefined)
  )
  if ('parentId' in data) patch.parentId = data.parentId || null

  if (patch.parentId && patch.parentId !== account.parentId) {
    const parent = await ChartOfAccount.findByPk(patch.parentId)
    if (!parent) throw { status: 400, message: 'Parent account not found' }
    patch.level = parent.level + 1
  }

  patch.modifiedBy = userId || null
  await account.update(patch)
  return account.reload({ include: [{ model: ChartOfAccount, as: 'parent', attributes: ['id', 'code', 'name'] }] })
}

const remove = async (id) => {
  const account = await ChartOfAccount.findByPk(id)
  if (!account) throw { status: 404, message: 'Account not found' }
  const children = await ChartOfAccount.count({ where: { parentId: id } })
  if (children > 0) throw { status: 400, message: 'Cannot delete an account that has sub-accounts' }
  await account.destroy()
}

module.exports = { list, listAll, getById, create, update, remove, normalBalanceFor }
