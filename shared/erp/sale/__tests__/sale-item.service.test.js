jest.mock('../../../../server/models', () => ({
  SaleItem: { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Product:  {},
  Pricing:  {},
}))

jest.mock('../../settings/services/sequence.service', () => ({
  getNext: jest.fn(),
}), { virtual: true })

const { Op } = require('sequelize')
const { SaleItem } = require('../../../../server/models')
const seqSvc = require('../../settings/services/sequence.service')
const service = require('../services/sale-item.service')

describe('sale-item.list', () => {
  beforeEach(() => {
    SaleItem.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, scopes by org, excludes soft-deleted, eager-loads product + pricings', async () => {
    SaleItem.findAndCountAll.mockResolvedValueOnce({ count: 3, rows: [{ id: 's1' }] })
    const out = await service.list({ page: 2, limit: 5, organizationId: 'o' })
    expect(out).toEqual({ total: 3, page: 2, limit: 5, items: [{ id: 's1' }] })
    const args = SaleItem.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(5)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.include.map(i => i.as).sort()).toEqual(['pricings', 'product'])
  })

  test('search filters across name and code', async () => {
    await service.list({ search: 'widget', organizationId: 'o' })
    const or = SaleItem.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or[0].name[Op.like]).toBe('%widget%')
    expect(or[1].code[Op.like]).toBe('%widget%')
  })
})

describe('sale-item.getById', () => {
  test('throws 404 when missing', async () => {
    SaleItem.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Sale item not found' })
  })
})

describe('sale-item.create', () => {
  test('uses the SI sequence when autoCode is true', async () => {
    seqSvc.getNext.mockResolvedValue('SI-0007')
    SaleItem.create.mockResolvedValue({ id: 's1' })
    SaleItem.findByPk.mockResolvedValue({ id: 's1' })
    await service.create({ name: 'Widget', autoCode: true, userId: 'u' })
    expect(seqSvc.getNext).toHaveBeenCalledWith('SI', 'u')
    expect(SaleItem.create.mock.calls[0][0].code).toBe('SI-0007')
  })

  test('rejects when explicit code exists in the same organization', async () => {
    SaleItem.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'Widget', code: 'W-1', organizationId: 'o' }))
      .rejects.toEqual({ status: 400, message: 'Sale item code already exists' })
    expect(SaleItem.findOne).toHaveBeenCalledWith({ where: { code: 'W-1', organizationId: 'o' } })
    expect(SaleItem.create).not.toHaveBeenCalled()
  })

  test('trims code, defaults status to active, coerces falsy productId to null', async () => {
    SaleItem.findOne.mockResolvedValue(null)
    SaleItem.create.mockResolvedValue({ id: 's1' })
    SaleItem.findByPk.mockResolvedValue({ id: 's1' })
    await service.create({ name: 'Widget', code: '  W-9  ', productId: '', userId: 'u', organizationId: 'o' })
    const payload = SaleItem.create.mock.calls[0][0]
    expect(payload.code).toBe('W-9')
    expect(payload.status).toBe('active')
    expect(payload.productId).toBeNull()
  })

  test('omitting code persists null and skips findOne', async () => {
    SaleItem.create.mockResolvedValue({ id: 's1' })
    SaleItem.findByPk.mockResolvedValue({ id: 's1' })
    await service.create({ name: 'Widget' })
    expect(SaleItem.findOne).not.toHaveBeenCalled()
    expect(SaleItem.create.mock.calls[0][0].code).toBeNull()
  })
})

describe('sale-item.update', () => {
  test('throws 404 when missing', async () => {
    SaleItem.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' }, 'u'))
      .rejects.toEqual({ status: 404, message: 'Sale item not found' })
  })

  test('duplicate-code check on update is GLOBAL (no org/createdBy scoping)', async () => {
    const item = { id: 's1', code: 'OLD', update: jest.fn() }
    SaleItem.findByPk.mockResolvedValue(item)
    SaleItem.findOne.mockResolvedValue({ id: 's2' })
    await expect(service.update('s1', { code: 'DUP' }, 'u'))
      .rejects.toEqual({ status: 400, message: 'Sale item code already exists' })
    // Note: the where clause has NO organizationId or createdBy — that's
    // the actual (and arguably broken) behavior; pinning it down.
    expect(SaleItem.findOne).toHaveBeenCalledWith({ where: { code: 'DUP' } })
    expect(item.update).not.toHaveBeenCalled()
  })

  test('re-saving the same row with its own code does not trigger the lookup', async () => {
    const item = { id: 's1', code: 'SAME', update: jest.fn().mockResolvedValue() }
    SaleItem.findByPk
      .mockResolvedValueOnce(item)
      .mockResolvedValueOnce({ id: 's1' })
    await service.update('s1', { code: 'SAME' }, 'u')
    // code === item.code → no findOne lookup
    expect(SaleItem.findOne).not.toHaveBeenCalled()
    expect(item.update).toHaveBeenCalled()
  })

  test('spread filter — only patches supplied keys', async () => {
    const item = {
      id: 's1', code: 'OLD',
      update: jest.fn().mockResolvedValue(),
    }
    SaleItem.findByPk
      .mockResolvedValueOnce(item)
      .mockResolvedValueOnce({ id: 's1' })
    await service.update('s1', { name: 'New' }, 'u')
    const patch = item.update.mock.calls[0][0]
    expect(patch.name).toBe('New')
    expect(patch.modifiedBy).toBe('u')
    expect(patch).not.toHaveProperty('code')
    expect(patch).not.toHaveProperty('status')
    expect(patch).not.toHaveProperty('productId')
  })
})

describe('sale-item.remove', () => {
  test('throws 404 when missing', async () => {
    SaleItem.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Sale item not found' })
  })

  test('destroys the row', async () => {
    const item = { destroy: jest.fn().mockResolvedValue() }
    SaleItem.findByPk.mockResolvedValue(item)
    await service.remove('s1')
    expect(item.destroy).toHaveBeenCalled()
  })
})
