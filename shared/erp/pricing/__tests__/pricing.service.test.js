jest.mock('../../../../server/models', () => ({
  Pricing:       { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  CustomerGroup: {},
  SaleItem:      {},
}))

jest.mock('../../settings/services/sequence.service', () => ({
  getNext: jest.fn(),
}), { virtual: true })

const { Op } = require('sequelize')
const { Pricing } = require('../../../../server/models')
const seqSvc = require('../../settings/services/sequence.service')
const service = require('../pricing.service')

describe('pricing.list', () => {
  beforeEach(() => {
    Pricing.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates, scopes by org, excludes soft-deleted, eager-loads customer group', async () => {
    Pricing.findAndCountAll.mockResolvedValueOnce({ count: 4, rows: [{ id: 'p1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'org' })
    expect(out).toEqual({ total: 4, page: 2, limit: 2, pricings: [{ id: 'p1' }] })
    const args = Pricing.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('org')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.include[0]).toMatchObject({ as: 'customerGroup', attributes: ['id', 'name'] })
  })

  test('search filters on name only (no code/desc fallback)', async () => {
    await service.list({ search: 'vip', organizationId: 'org' })
    const w = Pricing.findAndCountAll.mock.calls[0][0].where
    expect(w.name[Op.like]).toBe('%vip%')
  })

  test('status / customerGroupId / active range filters apply when provided', async () => {
    await service.list({
      status: 'active',
      customerGroupId: 'cg-1',
      activeFrom: '2025-01-01',
      activeTo:   '2025-12-31',
      organizationId: 'org',
    })
    const w = Pricing.findAndCountAll.mock.calls[0][0].where
    expect(w.status).toBe('active')
    expect(w.customerGroupId).toBe('cg-1')
    expect(w.activeFrom[Op.gte]).toBe('2025-01-01')
    expect(w.activeTo[Op.lte]).toBe('2025-12-31')
  })

  test('null tenant when organizationId not supplied', async () => {
    await service.list({})
    expect(Pricing.findAndCountAll.mock.calls[0][0].where.organizationId).toBeNull()
  })
})

describe('pricing.getById', () => {
  test('throws 404 when missing', async () => {
    Pricing.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Pricing not found' })
  })

  test('eager-loads customerGroup and saleItem', async () => {
    Pricing.findByPk.mockResolvedValue({ id: 'p1' })
    await service.getById('p1')
    const args = Pricing.findByPk.mock.calls[0][1]
    expect(args.include.map(i => i.as).sort()).toEqual(['customerGroup', 'saleItem'])
  })
})

describe('pricing.create', () => {
  test('uses the PRC sequence when autoCode is true', async () => {
    seqSvc.getNext.mockResolvedValue('PRC-0007')
    Pricing.create.mockResolvedValue({ id: 'p1' })
    await service.create({ name: 'Std', autoCode: true, userId: 'u' })
    expect(seqSvc.getNext).toHaveBeenCalledWith('PRC', 'u')
    expect(Pricing.create.mock.calls[0][0].code).toBe('PRC-0007')
  })

  test('rejects when explicit code already exists in the same organization', async () => {
    Pricing.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'Std', code: 'P-1', organizationId: 'org' }))
      .rejects.toEqual({ status: 400, message: 'Pricing code already exists' })
    expect(Pricing.findOne).toHaveBeenCalledWith({ where: { code: 'P-1', organizationId: 'org' } })
    expect(Pricing.create).not.toHaveBeenCalled()
  })

  test('trims explicit code; defaults currency to USD and status to active', async () => {
    Pricing.findOne.mockResolvedValue(null)
    Pricing.create.mockResolvedValue({ id: 'p1' })
    await service.create({ name: 'Std', code: '  P-9  ', unitPrice: 10, organizationId: 'org', userId: 'u' })
    const payload = Pricing.create.mock.calls[0][0]
    expect(payload.code).toBe('P-9')
    expect(payload.currency).toBe('USD')
    expect(payload.status).toBe('active')
    expect(payload.organizationId).toBe('org')
    expect(payload.createdBy).toBe('u')
  })

  test('coerces empty active range and falsy FK strings to null', async () => {
    Pricing.create.mockResolvedValue({ id: 'p1' })
    await service.create({
      name: 'Std',
      activeFrom: '',
      activeTo:   '',
      saleItemId: '',
      customerGroupId: '',
    })
    const payload = Pricing.create.mock.calls[0][0]
    expect(payload.activeFrom).toBeNull()
    expect(payload.activeTo).toBeNull()
    expect(payload.saleItemId).toBeNull()
    expect(payload.customerGroupId).toBeNull()
  })

  test('omitting code entirely persists null (no findOne check)', async () => {
    Pricing.create.mockResolvedValue({ id: 'p1' })
    await service.create({ name: 'Std' })
    expect(Pricing.findOne).not.toHaveBeenCalled()
    expect(Pricing.create.mock.calls[0][0].code).toBeNull()
  })
})

describe('pricing.update', () => {
  test('throws 404 when missing', async () => {
    Pricing.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' }, 'u'))
      .rejects.toEqual({ status: 404, message: 'Pricing not found' })
  })

  test('rejects code collision scoped to the same creator (not org)', async () => {
    const pricing = { id: 'p1', createdBy: 'u-creator', update: jest.fn() }
    Pricing.findByPk.mockResolvedValue(pricing)
    Pricing.findOne.mockResolvedValue({ id: 'p2' })
    await expect(service.update('p1', { code: 'DUP' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'Pricing code already exists' })
    expect(Pricing.findOne).toHaveBeenCalledWith({ where: { code: 'DUP', createdBy: 'u-creator' } })
    expect(pricing.update).not.toHaveBeenCalled()
  })

  test('allows re-saving the same row with its own code', async () => {
    const pricing = { id: 'p1', createdBy: 'u-creator', update: jest.fn().mockResolvedValue() }
    Pricing.findByPk.mockResolvedValue(pricing)
    Pricing.findOne.mockResolvedValue({ id: 'p1' }) // self
    await service.update('p1', { code: 'SAME' }, 'u2')
    expect(pricing.update).toHaveBeenCalled()
  })

  test('only patches supplied fields; coerces empties to null', async () => {
    const pricing = { id: 'p1', createdBy: 'u', update: jest.fn().mockResolvedValue() }
    Pricing.findByPk.mockResolvedValue(pricing)
    await service.update('p1', {
      name: 'New',
      saleItemId: '',
      customerGroupId: '',
      activeFrom: '',
      activeTo: '2026-01-01',
    }, 'u2')
    const patch = pricing.update.mock.calls[0][0]
    expect(patch.name).toBe('New')
    expect(patch.saleItemId).toBeNull()
    expect(patch.customerGroupId).toBeNull()
    expect(patch.activeFrom).toBeNull()
    expect(patch.activeTo).toBe('2026-01-01')
    expect(patch.modifiedBy).toBe('u2')
    expect(patch).not.toHaveProperty('status') // not supplied → not patched
  })
})

describe('pricing.remove', () => {
  test('throws 404 when missing', async () => {
    Pricing.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Pricing not found' })
  })

  test('destroys the row', async () => {
    const pricing = { destroy: jest.fn().mockResolvedValue() }
    Pricing.findByPk.mockResolvedValue(pricing)
    await service.remove('p1')
    expect(pricing.destroy).toHaveBeenCalled()
  })
})
