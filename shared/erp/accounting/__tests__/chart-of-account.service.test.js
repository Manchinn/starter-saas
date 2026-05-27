jest.mock('../../../../server/models', () => ({
  ChartOfAccount: {
    findAndCountAll: jest.fn(),
    findAll:         jest.fn(),
    findByPk:        jest.fn(),
    findOne:         jest.fn(),
    create:          jest.fn(),
    count:           jest.fn(),
  },
}))

const { Op } = require('sequelize')
const { ChartOfAccount } = require('../../../../server/models')
const service = require('../services/chart-of-account.service')

describe('chart-of-account.list', () => {
  test('paginates, scopes by org, excludes soft-deleted, eager-loads parent', async () => {
    ChartOfAccount.findAndCountAll.mockResolvedValue({ count: 3, rows: [{ id: 'a' }] })
    const out = await service.list({ page: 2, limit: 5, organizationId: 'org-1' })
    expect(out).toEqual({ total: 3, page: 2, limit: 5, accounts: [{ id: 'a' }] })

    const args = ChartOfAccount.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(5)
    expect(args.where.organizationId).toBe('org-1')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['code', 'ASC']])
    expect(args.include[0].as).toBe('parent')
  })

  test('search across code and name; accountType filter', async () => {
    ChartOfAccount.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
    await service.list({ search: '1130', accountType: 'asset', organizationId: 'o' })
    const w = ChartOfAccount.findAndCountAll.mock.calls[0][0].where
    expect(w[Op.or][0].code[Op.like]).toBe('%1130%')
    expect(w[Op.or][1].name[Op.like]).toBe('%1130%')
    expect(w.accountType).toBe('asset')
  })
})

describe('chart-of-account.getById', () => {
  test('throws 404 when missing', async () => {
    ChartOfAccount.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Account not found' })
  })
})

describe('chart-of-account.create', () => {
  test('rejects when code, name, or accountType missing', async () => {
    await expect(service.create({ name: 'x', accountType: 'asset' }))
      .rejects.toEqual({ status: 400, message: 'Account code is required' })
    await expect(service.create({ code: '1', accountType: 'asset' }))
      .rejects.toEqual({ status: 400, message: 'Account name is required' })
    await expect(service.create({ code: '1', name: 'x' }))
      .rejects.toEqual({ status: 400, message: 'Account type is required' })
  })

  test('rejects when code already exists in the same organization', async () => {
    ChartOfAccount.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ code: '1130', name: 'AR', accountType: 'asset', organizationId: 'o' }))
      .rejects.toEqual({ status: 400, message: 'Account code already exists' })
    expect(ChartOfAccount.findOne).toHaveBeenCalledWith({ where: { code: '1130', organizationId: 'o' } })
  })

  test('infers normal balance from account type when not provided', async () => {
    ChartOfAccount.findOne.mockResolvedValue(null)
    ChartOfAccount.create.mockResolvedValue({ id: 'a' })
    await service.create({ code: '4110', name: 'Sales', accountType: 'revenue' })
    expect(ChartOfAccount.create.mock.calls[0][0].normalBalance).toBe('credit')
  })

  test('respects explicit normal balance over the type default', async () => {
    ChartOfAccount.findOne.mockResolvedValue(null)
    ChartOfAccount.create.mockResolvedValue({ id: 'a' })
    await service.create({ code: '1130', name: 'X', accountType: 'asset', normalBalance: 'credit' })
    expect(ChartOfAccount.create.mock.calls[0][0].normalBalance).toBe('credit')
  })

  test('parent: inherits level = parent.level + 1', async () => {
    ChartOfAccount.findOne.mockResolvedValue(null)
    ChartOfAccount.findByPk.mockResolvedValue({ id: 'p', level: 2 })
    ChartOfAccount.create.mockResolvedValue({ id: 'a' })
    await service.create({ code: '1131', name: 'Sub', accountType: 'asset', parentId: 'p' })
    expect(ChartOfAccount.create.mock.calls[0][0].level).toBe(3)
  })

  test('rejects when parent does not exist', async () => {
    ChartOfAccount.findOne.mockResolvedValue(null)
    ChartOfAccount.findByPk.mockResolvedValue(null)
    await expect(service.create({ code: '1', name: 'X', accountType: 'asset', parentId: 'missing' }))
      .rejects.toEqual({ status: 400, message: 'Parent account not found' })
  })

  test('top-level accounts get level=1', async () => {
    ChartOfAccount.findOne.mockResolvedValue(null)
    ChartOfAccount.create.mockResolvedValue({ id: 'a' })
    await service.create({ code: '1000', name: 'Assets', accountType: 'asset' })
    expect(ChartOfAccount.create.mock.calls[0][0].level).toBe(1)
  })
})

describe('chart-of-account.update', () => {
  test('throws 404 when missing', async () => {
    ChartOfAccount.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' })).rejects.toEqual({ status: 404, message: 'Account not found' })
  })

  test('rejects code change that collides with another account in the same org', async () => {
    const acc = { id: 'a', code: '1130', organizationId: 'o', update: jest.fn() }
    ChartOfAccount.findByPk.mockResolvedValue(acc)
    ChartOfAccount.findOne.mockResolvedValue({ id: 'b' })
    await expect(service.update('a', { code: '1131' }, 'u'))
      .rejects.toEqual({ status: 400, message: 'Account code already exists' })
    expect(ChartOfAccount.findOne).toHaveBeenCalledWith({
      where: { code: '1131', organizationId: 'o', id: { [Op.ne]: 'a' } },
    })
  })

  test('changing parent re-derives level', async () => {
    const acc = {
      id: 'a', code: '1131', organizationId: 'o', parentId: null, level: 1,
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue({ id: 'a' }),
    }
    ChartOfAccount.findByPk
      .mockResolvedValueOnce(acc)       // initial fetch
      .mockResolvedValueOnce({ id: 'newParent', level: 2 }) // new parent lookup
    await service.update('a', { parentId: 'newParent' }, 'u')
    expect(acc.update.mock.calls[0][0].level).toBe(3)
  })
})

describe('chart-of-account.remove', () => {
  test('blocks deletion when sub-accounts exist', async () => {
    const acc = { destroy: jest.fn() }
    ChartOfAccount.findByPk.mockResolvedValue(acc)
    ChartOfAccount.count.mockResolvedValue(2)
    await expect(service.remove('a'))
      .rejects.toEqual({ status: 400, message: 'Cannot delete an account that has sub-accounts' })
    expect(acc.destroy).not.toHaveBeenCalled()
  })

  test('destroys when no sub-accounts', async () => {
    const acc = { destroy: jest.fn().mockResolvedValue() }
    ChartOfAccount.findByPk.mockResolvedValue(acc)
    ChartOfAccount.count.mockResolvedValue(0)
    await service.remove('a')
    expect(acc.destroy).toHaveBeenCalled()
  })
})
