const { ChartOfAccount } = require('../../../../server/models')
const { Op } = require('sequelize')
const { findByPkScoped } = require('../../../../server/core/tenant')

const normalBalanceFor = {
  asset:     'debit',
  expense:   'debit',
  liability: 'credit',
  equity:    'credit',
  revenue:   'credit',
}

// ── TFRS for NPAEs statement line-item classification ─────────────────────────
// The category groups an account into a line of the financial statements
// (current vs non-current, cost of sales vs operating expense, etc.). Keyed by
// accountType; this is the single source of truth shared by the validator,
// the demo seed and the reporting services.
const CATEGORIES_BY_TYPE = {
  asset: [
    'cash_and_equivalents',
    'trade_receivables',
    'inventories',
    'other_current_assets',
    'property_plant_equipment',
    'other_non_current_assets',
  ],
  liability: [
    'trade_payables',
    'short_term_borrowings',
    'other_current_liabilities',
    'long_term_borrowings',
    'other_non_current_liabilities',
  ],
  equity: [
    'owners_capital',
    'retained_earnings',
  ],
  revenue: [
    'revenue',
    'other_income',
  ],
  expense: [
    'cost_of_sales',
    'selling_admin_expenses',
    'other_expenses',
    'finance_costs',
    'income_tax_expense',
  ],
}

const ALL_CATEGORIES = Object.values(CATEGORIES_BY_TYPE).flat()

// Default (most common) category for a type, used when none is supplied.
const defaultCategoryFor = (accountType) => (CATEGORIES_BY_TYPE[accountType] || [])[0] || null

// ── TFRS for NPAEs statement structure ───────────────────────────────────────
// Maps each statement section to the categories that roll into it. Single
// source of truth shared by the financial-statements service and the UI.
const STATEMENT_STRUCTURE = {
  balanceSheet: {
    currentAssets:        ['cash_and_equivalents', 'trade_receivables', 'inventories', 'other_current_assets'],
    nonCurrentAssets:     ['property_plant_equipment', 'other_non_current_assets'],
    currentLiabilities:   ['trade_payables', 'short_term_borrowings', 'other_current_liabilities'],
    nonCurrentLiabilities:['long_term_borrowings', 'other_non_current_liabilities'],
    equity:               ['owners_capital', 'retained_earnings'],
  },
  // Income statement lines in presentation order (by function).
  incomeStatement: [
    'revenue',
    'cost_of_sales',
    'other_income',
    'selling_admin_expenses',
    'other_expenses',
    'finance_costs',
    'income_tax_expense',
  ],
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
    order: [['code', 'DESC']],
  })

  return { total: count, page, limit, accounts: rows }
}

const listAll = async (organizationId) => {
  const accounts = await ChartOfAccount.findAll({
    where: { organizationId: organizationId || null, status: 'active', dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'code', 'name', 'accountType', 'statementCategory', 'level'],
    order: [['code', 'DESC']],
  })
  return accounts
}

const getById = async (id, organizationId) => {
  const account = await findByPkScoped(ChartOfAccount, id, organizationId, {
    include: [{ model: ChartOfAccount, as: 'parent', attributes: ['id', 'code', 'name'] }],
  })
  if (!account) throw { status: 404, message: 'Account not found' }
  return account
}

const create = async ({ code, name, accountType, statementCategory, normalBalance, description, parentId, status = 'active', userId, organizationId }) => {
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
    statementCategory: statementCategory || defaultCategoryFor(accountType),
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

const update = async (id, data, userId, organizationId) => {
  const account = await findByPkScoped(ChartOfAccount, id, organizationId)
  if (!account) throw { status: 404, message: 'Account not found' }

  if (data.code && data.code !== account.code) {
    const existing = await ChartOfAccount.findOne({
      where: { code: data.code.trim(), organizationId: account.organizationId, id: { [Op.ne]: id } },
    })
    if (existing) throw { status: 400, message: 'Account code already exists' }
  }

  const allowed = ['code', 'name', 'accountType', 'statementCategory', 'normalBalance', 'description', 'parentId', 'status']
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

const remove = async (id, organizationId) => {
  const account = await findByPkScoped(ChartOfAccount, id, organizationId)
  if (!account) throw { status: 404, message: 'Account not found' }
  const children = await ChartOfAccount.count({ where: { parentId: id } })
  if (children > 0) throw { status: 400, message: 'Cannot delete an account that has sub-accounts' }
  await account.destroy()
}

module.exports = {
  list, listAll, getById, create, update, remove,
  normalBalanceFor, CATEGORIES_BY_TYPE, ALL_CATEGORIES, defaultCategoryFor, STATEMENT_STRUCTURE,
}
