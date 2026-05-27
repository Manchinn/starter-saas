jest.mock('../../../../server/models', () => ({
  SalePackage:     { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  SalePackageItem: { destroy: jest.fn(), bulkCreate: jest.fn() },
  SaleItem:        {},
}))

// Transaction passthrough — run the callback inline so we can assert on the
// inner calls without faking the full sequelize.transaction contract.
jest.mock('../../../../server/config/database', () => ({
  transaction: jest.fn(async (cb) => cb('tx')),
}))

jest.mock('../../settings/services/sequence.service', () => ({
  getNext: jest.fn(),
}), { virtual: true })

const { Op } = require('sequelize')
const { SalePackage, SalePackageItem } = require('../../../../server/models')
const sequelize = require('../../../../server/config/database')
const seqSvc = require('../../settings/services/sequence.service')
const service = require('../services/sale-package.service')

beforeEach(() => {
  // resetMocks: true wipes implementations; re-bind transaction passthrough.
  sequelize.transaction.mockImplementation(async (cb) => cb('tx'))
})

describe('sale-package.list', () => {
  beforeEach(() => {
    SalePackage.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, org+soft-delete scoping, distinct: true (joined items)', async () => {
    SalePackage.findAndCountAll.mockResolvedValueOnce({ count: 2, rows: [{ id: 'pk1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'o' })
    expect(out).toEqual({ total: 2, page: 2, limit: 2, items: [{ id: 'pk1' }] })
    const args = SalePackage.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('o')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.distinct).toBe(true)
  })

  test('search filters across name and code', async () => {
    await service.list({ search: 'combo', organizationId: 'o' })
    const or = SalePackage.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or[0].name[Op.like]).toBe('%combo%')
    expect(or[1].code[Op.like]).toBe('%combo%')
  })
})

describe('sale-package.getById', () => {
  test('throws 404 when missing', async () => {
    SalePackage.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Sale package not found' })
  })
})

describe('sale-package.create', () => {
  test('uses the PKG sequence when autoCode is true', async () => {
    seqSvc.getNext.mockResolvedValue('PKG-0007')
    SalePackage.create.mockResolvedValue({ id: 'pk1' })
    SalePackage.findByPk.mockResolvedValue({ id: 'pk1' })
    await service.create({ name: 'Combo', autoCode: true, userId: 'u' })
    expect(seqSvc.getNext).toHaveBeenCalledWith('PKG', 'u')
    expect(SalePackage.create.mock.calls[0][0].code).toBe('PKG-0007')
  })

  test('rejects when explicit code exists in the same organization', async () => {
    SalePackage.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'Combo', code: 'PK-1', organizationId: 'o' }))
      .rejects.toEqual({ status: 400, message: 'Package code already exists' })
    expect(SalePackage.findOne).toHaveBeenCalledWith({ where: { code: 'PK-1', organizationId: 'o' } })
  })

  test('items bulkCreate uses sortOrder from item or falls back to array index', async () => {
    SalePackage.findOne.mockResolvedValue(null)
    SalePackage.create.mockResolvedValue({ id: 'pk1' })
    SalePackage.findByPk.mockResolvedValue({ id: 'pk1' })
    await service.create({
      name: 'Combo',
      items: [
        { saleItemId: 's1', quantity: 2, unitPrice: 9.99 },                  // no sortOrder → 0
        { saleItemId: 's2', sortOrder: 5, notes: 'note' },                    // explicit
        { saleItemId: 's3' },                                                 // defaults: qty 1, unitPrice null, sortOrder 2 (idx)
      ],
    })
    const rows = SalePackageItem.bulkCreate.mock.calls[0][0]
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ packageId: 'pk1', saleItemId: 's1', quantity: 2, unitPrice: 9.99, sortOrder: 0, notes: null })
    expect(rows[1]).toMatchObject({ saleItemId: 's2', sortOrder: 5, quantity: 1, unitPrice: null, notes: 'note' })
    expect(rows[2]).toMatchObject({ saleItemId: 's3', sortOrder: 2, quantity: 1, unitPrice: null, notes: null })
  })

  test('skips items bulkCreate when items array is empty', async () => {
    SalePackage.findOne.mockResolvedValue(null)
    SalePackage.create.mockResolvedValue({ id: 'pk1' })
    SalePackage.findByPk.mockResolvedValue({ id: 'pk1' })
    await service.create({ name: 'Empty' })
    expect(SalePackageItem.bulkCreate).not.toHaveBeenCalled()
  })

  test('defaults status to active and description null', async () => {
    SalePackage.create.mockResolvedValue({ id: 'pk1' })
    SalePackage.findByPk.mockResolvedValue({ id: 'pk1' })
    await service.create({ name: 'Combo' })
    const payload = SalePackage.create.mock.calls[0][0]
    expect(payload.status).toBe('active')
    expect(payload.description).toBeNull()
  })
})

describe('sale-package.update', () => {
  test('throws 404 when missing', async () => {
    SalePackage.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' }, 'u'))
      .rejects.toEqual({ status: 404, message: 'Sale package not found' })
  })

  test('duplicate-code check is GLOBAL (no org scoping)', async () => {
    const pkg = { id: 'pk1', code: 'OLD', update: jest.fn() }
    SalePackage.findByPk.mockResolvedValue(pkg)
    SalePackage.findOne.mockResolvedValue({ id: 'pk2' })
    await expect(service.update('pk1', { code: 'DUP' }, 'u'))
      .rejects.toEqual({ status: 400, message: 'Package code already exists' })
    expect(SalePackage.findOne).toHaveBeenCalledWith({ where: { code: 'DUP' } })
  })

  test('items: array replaces the existing collection wholesale', async () => {
    const pkg = { id: 'pk1', code: 'OLD', update: jest.fn().mockResolvedValue() }
    SalePackage.findByPk
      .mockResolvedValueOnce(pkg)
      .mockResolvedValueOnce({ id: 'pk1' })
    await service.update('pk1', { items: [{ saleItemId: 's1' }] }, 'u')

    // destroy first, then bulkCreate the new rows
    expect(SalePackageItem.destroy).toHaveBeenCalledWith({ where: { packageId: 'pk1' }, transaction: 'tx' })
    const rows = SalePackageItem.bulkCreate.mock.calls[0][0]
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ packageId: 'pk1', saleItemId: 's1', quantity: 1, sortOrder: 0 })
  })

  test('items: empty array still clears the collection but skips bulkCreate', async () => {
    const pkg = { id: 'pk1', code: 'OLD', update: jest.fn().mockResolvedValue() }
    SalePackage.findByPk
      .mockResolvedValueOnce(pkg)
      .mockResolvedValueOnce({ id: 'pk1' })
    await service.update('pk1', { items: [] }, 'u')
    expect(SalePackageItem.destroy).toHaveBeenCalledWith({ where: { packageId: 'pk1' }, transaction: 'tx' })
    expect(SalePackageItem.bulkCreate).not.toHaveBeenCalled()
  })

  test('omitting items leaves the existing collection untouched', async () => {
    const pkg = { id: 'pk1', code: 'OLD', update: jest.fn().mockResolvedValue() }
    SalePackage.findByPk
      .mockResolvedValueOnce(pkg)
      .mockResolvedValueOnce({ id: 'pk1' })
    await service.update('pk1', { name: 'Renamed' }, 'u')
    expect(SalePackageItem.destroy).not.toHaveBeenCalled()
    expect(SalePackageItem.bulkCreate).not.toHaveBeenCalled()
  })
})

describe('sale-package.remove', () => {
  test('throws 404 when missing', async () => {
    SalePackage.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Sale package not found' })
  })

  test('destroys the row', async () => {
    const pkg = { destroy: jest.fn().mockResolvedValue() }
    SalePackage.findByPk.mockResolvedValue(pkg)
    await service.remove('pk1')
    expect(pkg.destroy).toHaveBeenCalled()
  })
})
