// Unit tests for store.service.
//
// Mocks the Sequelize facade (Store + StoreStock for the on-hand check that
// blocks deletion) and the lazily-required sequence service.

jest.mock('../../../../server/models', () => ({
  Store: {
    findAndCountAll: jest.fn(),
    findByPk:        jest.fn(),
    findOne:         jest.fn(),
    create:          jest.fn(),
  },
  StoreStock: {
    sum: jest.fn(),
  },
}))

jest.mock('../../settings/services/sequence.service', () => ({
  getNext: jest.fn(),
}), { virtual: true })

const { Op } = require('sequelize')
const { Store, StoreStock } = require('../../../../server/models')
const seqSvc = require('../../settings/services/sequence.service')
const service = require('../services/store.service')

describe('store.service.list', () => {
  beforeEach(() => {
    Store.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates and returns { total, page, limit, stores }', async () => {
    Store.findAndCountAll.mockResolvedValueOnce({ count: 8, rows: [{ id: 's1' }] })
    const out = await service.list({ page: 2, limit: 4, organizationId: 'org-1' })
    expect(out).toEqual({ total: 8, page: 2, limit: 4, stores: [{ id: 's1' }] })

    const args = Store.findAndCountAll.mock.calls[0][0]
    expect(args.limit).toBe(4)
    expect(args.offset).toBe(4)
    expect(args.where.organizationId).toBe('org-1')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['name', 'ASC']])
  })

  test('search filters across name and code via OR', async () => {
    await service.list({ search: 'main', organizationId: 'org-1' })
    const or = Store.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or).toHaveLength(2)
    expect(or[0].name[Op.like]).toBe('%main%')
    expect(or[1].code[Op.like]).toBe('%main%')
  })

  test('applies status and active range only when provided', async () => {
    await service.list({ status: 'active', activeFrom: '2025-01-01', activeTo: '2025-12-31', organizationId: 'o' })
    const w = Store.findAndCountAll.mock.calls[0][0].where
    expect(w.status).toBe('active')
    expect(w.activeFrom[Op.gte]).toBe('2025-01-01')
    expect(w.activeTo[Op.lte]).toBe('2025-12-31')
  })
})

describe('store.service.getById', () => {
  test('returns the row when found', async () => {
    Store.findByPk.mockResolvedValue({ id: 's1' })
    await expect(service.getById('s1')).resolves.toEqual({ id: 's1' })
  })

  test('throws 404 when missing', async () => {
    Store.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Store not found' })
  })
})

describe('store.service.create', () => {
  test('rejects blank names', async () => {
    await expect(service.create({ name: '   ' })).rejects.toEqual({ status: 400, message: 'Name is required' })
    expect(Store.create).not.toHaveBeenCalled()
  })

  test('uses the WHS sequence when autoCode is true', async () => {
    seqSvc.getNext.mockResolvedValue('WHS-0003')
    Store.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: 'Main', autoCode: true, userId: 'u1' })
    expect(seqSvc.getNext).toHaveBeenCalledWith('WHS', 'u1')
    expect(Store.create.mock.calls[0][0].code).toBe('WHS-0003')
  })

  test('rejects when explicit code already exists in the same organization', async () => {
    Store.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'Main', code: 'M-1', organizationId: 'org-1' }))
      .rejects.toEqual({ status: 400, message: 'Store code already exists' })
    expect(Store.findOne).toHaveBeenCalledWith({ where: { code: 'M-1', organizationId: 'org-1' } })
    expect(Store.create).not.toHaveBeenCalled()
  })

  test('trims name + code and coerces blank active range to null', async () => {
    Store.findOne.mockResolvedValue(null)
    Store.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: '  Main  ', code: '  M-9  ', activeFrom: '', activeTo: '', userId: 'u1', organizationId: 'org-1' })
    const payload = Store.create.mock.calls[0][0]
    expect(payload.name).toBe('Main')
    expect(payload.code).toBe('M-9')
    expect(payload.activeFrom).toBeNull()
    expect(payload.activeTo).toBeNull()
    expect(payload.status).toBe('active')
    expect(payload.organizationId).toBe('org-1')
    expect(payload.createdBy).toBe('u1')
  })
})

describe('store.service.update', () => {
  test('throws 404 when missing', async () => {
    Store.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' })).rejects.toEqual({ status: 404, message: 'Store not found' })
  })

  test('filters disallowed fields and coerces blank active range', async () => {
    const store = {
      id: 's1',
      createdBy: 'u-creator',
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue({ id: 's1', name: 'New' }),
    }
    Store.findByPk.mockResolvedValue(store)
    const out = await service.update('s1', {
      name: 'New',
      organizationId: 'attack', // not in allowed list
      activeFrom: '',
      activeTo: '2026-01-01',
    }, 'u2')

    const patch = store.update.mock.calls[0][0]
    expect(patch.name).toBe('New')
    expect(patch.activeFrom).toBeNull()
    expect(patch.activeTo).toBe('2026-01-01')
    expect(patch.modifiedBy).toBe('u2')
    expect(patch).not.toHaveProperty('organizationId')
    expect(out).toEqual({ id: 's1', name: 'New' })
  })

  test('rejects code collision with another store from the same creator', async () => {
    const store = { id: 's1', createdBy: 'u-creator', update: jest.fn() }
    Store.findByPk.mockResolvedValue(store)
    Store.findOne.mockResolvedValue({ id: 's2' })
    await expect(service.update('s1', { code: 'DUP' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'Store code already exists' })
    expect(Store.findOne).toHaveBeenCalledWith({ where: { code: 'DUP', createdBy: 'u-creator' } })
    expect(store.update).not.toHaveBeenCalled()
  })

  test('allows re-saving the same store with its own code', async () => {
    const store = {
      id: 's1', createdBy: 'u-creator',
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue({}),
    }
    Store.findByPk.mockResolvedValue(store)
    Store.findOne.mockResolvedValue({ id: 's1' }) // self
    await service.update('s1', { code: 'SAME' }, 'u2')
    expect(store.update).toHaveBeenCalled()
  })
})

describe('store.service.remove', () => {
  test('throws 404 when missing', async () => {
    Store.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Store not found' })
  })

  test('blocks deletion when stock on hand is greater than zero', async () => {
    const store = { id: 's1', name: 'Main', destroy: jest.fn() }
    Store.findByPk.mockResolvedValue(store)
    StoreStock.sum.mockResolvedValue(12)
    await expect(service.remove('s1')).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('12 unit(s) of stock on hand'),
    })
    expect(StoreStock.sum).toHaveBeenCalledWith('stock', { where: { storeId: 's1' } })
    expect(store.destroy).not.toHaveBeenCalled()
  })

  test('destroys when stock on hand is zero', async () => {
    const store = { id: 's1', name: 'Main', destroy: jest.fn().mockResolvedValue() }
    Store.findByPk.mockResolvedValue(store)
    StoreStock.sum.mockResolvedValue(0)
    await service.remove('s1')
    expect(store.destroy).toHaveBeenCalled()
  })

  test('destroys when stock on hand is null (no rows)', async () => {
    const store = { id: 's1', name: 'Main', destroy: jest.fn().mockResolvedValue() }
    Store.findByPk.mockResolvedValue(store)
    StoreStock.sum.mockResolvedValue(null)
    await service.remove('s1')
    expect(store.destroy).toHaveBeenCalled()
  })
})
