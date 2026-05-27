// Unit tests for vendor.service.
//
// Vendor lives at shared/erp/vendors/ (one level shallower than customers),
// so the models import path is ../../../server/models. We mock that module
// wholesale plus the lazily-required sequence service so the suite is DB-free.

jest.mock('../../../../server/models', () => ({
  Vendor: {
    findAndCountAll: jest.fn(),
    findAll:         jest.fn(),
    findByPk:        jest.fn(),
    findOne:         jest.fn(),
    create:          jest.fn(),
  },
}))

jest.mock('../../settings/services/sequence.service', () => ({
  getNext: jest.fn(),
}), { virtual: true })

const { Op } = require('sequelize')
const { Vendor } = require('../../../../server/models')
const seqSvc = require('../../settings/services/sequence.service')
const service = require('../vendor.service')

describe('vendor.service.list', () => {
  beforeEach(() => {
    Vendor.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates and returns shape { total, page, limit, vendors }', async () => {
    Vendor.findAndCountAll.mockResolvedValueOnce({ count: 7, rows: [{ id: 'v1' }] })
    const out = await service.list({ page: 2, limit: 5, organizationId: 'org-1' })
    expect(out).toEqual({ total: 7, page: 2, limit: 5, vendors: [{ id: 'v1' }] })

    const args = Vendor.findAndCountAll.mock.calls[0][0]
    expect(args.limit).toBe(5)
    expect(args.offset).toBe(5)
    expect(args.where.organizationId).toBe('org-1')
    // soft-deleted records excluded
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['createdAt', 'DESC']])
  })

  test('applies search across name/code/email via OR', async () => {
    await service.list({ search: 'acme', organizationId: 'org-1' })
    const args = Vendor.findAndCountAll.mock.calls[0][0]
    const or = args.where[Op.or]
    expect(or).toHaveLength(3)
    expect(or[0].name[Op.like]).toBe('%acme%')
    expect(or[1].code[Op.like]).toBe('%acme%')
    expect(or[2].email[Op.like]).toBe('%acme%')
  })

  test('applies status/typeFilter/active range only when provided', async () => {
    await service.list({
      status: 'active',
      typeFilter: 'supplier',
      activeFrom: '2025-01-01',
      activeTo: '2025-12-31',
      organizationId: 'org-1',
    })
    const args = Vendor.findAndCountAll.mock.calls[0][0]
    expect(args.where.status).toBe('active')
    expect(args.where.vendorTypes[Op.like]).toBe('%supplier%')
    expect(args.where.activeFrom[Op.gte]).toBe('2025-01-01')
    expect(args.where.activeTo[Op.lte]).toBe('2025-12-31')
  })

  test('treats missing organizationId as null tenant', async () => {
    await service.list({})
    expect(Vendor.findAndCountAll.mock.calls[0][0].where.organizationId).toBeNull()
  })
})

describe('vendor.service.getById', () => {
  test('returns the vendor when found', async () => {
    Vendor.findByPk.mockResolvedValue({ id: 'v1', name: 'Acme' })
    await expect(service.getById('v1')).resolves.toEqual({ id: 'v1', name: 'Acme' })
  })

  test('throws 404 when not found', async () => {
    Vendor.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Vendor not found' })
  })
})

describe('vendor.service.create', () => {
  test('rejects when name is missing or blank', async () => {
    await expect(service.create({ name: '' })).rejects.toEqual({ status: 400, message: 'Name is required' })
    await expect(service.create({ name: '   ' })).rejects.toEqual({ status: 400, message: 'Name is required' })
    expect(Vendor.create).not.toHaveBeenCalled()
  })

  test('uses sequence service when autoCode is true', async () => {
    seqSvc.getNext.mockResolvedValue('VND-0042')
    Vendor.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: 'Acme', autoCode: true, userId: 'u1' })
    expect(seqSvc.getNext).toHaveBeenCalledWith('VND', 'u1')
    expect(Vendor.create.mock.calls[0][0].code).toBe('VND-0042')
  })

  test('rejects when an explicit code already exists in the same organization', async () => {
    Vendor.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'Acme', code: 'V-1', organizationId: 'org-1' }))
      .rejects.toEqual({ status: 400, message: 'Vendor code already exists' })
    expect(Vendor.findOne).toHaveBeenCalledWith({
      where: { code: 'V-1', organizationId: 'org-1' },
    })
    expect(Vendor.create).not.toHaveBeenCalled()
  })

  test('uses trimmed explicit code when available', async () => {
    Vendor.findOne.mockResolvedValue(null)
    Vendor.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: 'Acme', code: '  V-9  ' })
    expect(Vendor.create.mock.calls[0][0].code).toBe('V-9')
  })

  test('trims name, defaults vendorTypes to [] and coerces empty active range to null', async () => {
    Vendor.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: '  Acme  ', activeFrom: '', activeTo: '', userId: 'u1', organizationId: 'org-1' })
    const payload = Vendor.create.mock.calls[0][0]
    expect(payload.name).toBe('Acme')
    expect(payload.vendorTypes).toEqual([])
    expect(payload.activeFrom).toBeNull()
    expect(payload.activeTo).toBeNull()
    expect(payload.createdBy).toBe('u1')
    expect(payload.organizationId).toBe('org-1')
    expect(payload.status).toBe('active') // default
  })

  test('passes through caller-supplied vendorTypes array', async () => {
    Vendor.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: 'Acme', vendorTypes: ['supplier', 'contractor'] })
    expect(Vendor.create.mock.calls[0][0].vendorTypes).toEqual(['supplier', 'contractor'])
  })
})

describe('vendor.service.update', () => {
  test('throws 404 when the row is missing', async () => {
    Vendor.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' })).rejects.toEqual({ status: 404, message: 'Vendor not found' })
  })

  test('only patches fields that were explicitly supplied (undefined skipped)', async () => {
    const vendor = {
      id: 'v1',
      createdBy: 'u-creator',
      update: jest.fn().mockResolvedValue(),
    }
    Vendor.findByPk.mockResolvedValue(vendor)
    await service.update('v1', { name: '  New  ', email: 'a@b.com' }, 'u2')

    const patch = vendor.update.mock.calls[0][0]
    expect(patch.name).toBe('New')
    expect(patch.email).toBe('a@b.com')
    expect(patch.modifiedBy).toBe('u2')
    // fields not supplied stay out of the patch
    expect(patch).not.toHaveProperty('phone')
    expect(patch).not.toHaveProperty('vendorTypes')
    expect(patch).not.toHaveProperty('status')
  })

  test('coerces empty active range strings to null', async () => {
    const vendor = { id: 'v1', createdBy: 'u', update: jest.fn().mockResolvedValue() }
    Vendor.findByPk.mockResolvedValue(vendor)
    await service.update('v1', { activeFrom: '', activeTo: '' }, 'u2')
    const patch = vendor.update.mock.calls[0][0]
    expect(patch.activeFrom).toBeNull()
    expect(patch.activeTo).toBeNull()
  })

  test('rejects when code collides with another vendor sharing the same creator', async () => {
    const vendor = { id: 'v1', createdBy: 'u-creator', update: jest.fn() }
    Vendor.findByPk.mockResolvedValue(vendor)
    Vendor.findOne.mockResolvedValue({ id: 'v2' }) // different id → conflict
    await expect(service.update('v1', { code: 'DUP' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'Vendor code already exists' })
    expect(Vendor.findOne).toHaveBeenCalledWith({
      where: { code: 'DUP', createdBy: 'u-creator' },
    })
    expect(vendor.update).not.toHaveBeenCalled()
  })

  test('allows re-saving the same row with its own code (id match → no conflict)', async () => {
    const vendor = { id: 'v1', createdBy: 'u-creator', update: jest.fn().mockResolvedValue() }
    Vendor.findByPk.mockResolvedValue(vendor)
    Vendor.findOne.mockResolvedValue({ id: 'v1' }) // matches self
    await service.update('v1', { code: 'SAME' }, 'u2')
    expect(vendor.update).toHaveBeenCalled()
    expect(vendor.update.mock.calls[0][0].code).toBe('SAME')
  })

  test('trims an explicit code on the patch and stores null for blank input', async () => {
    const vendor = { id: 'v1', createdBy: 'u-creator', update: jest.fn().mockResolvedValue() }
    Vendor.findByPk.mockResolvedValue(vendor)
    Vendor.findOne.mockResolvedValue(null)
    await service.update('v1', { code: '  V-9  ' }, 'u2')
    expect(vendor.update.mock.calls[0][0].code).toBe('V-9')

    // Blank string → null (no duplicate-check runs because code?.trim() is falsy)
    vendor.update.mockClear()
    await service.update('v1', { code: '   ' }, 'u2')
    expect(vendor.update.mock.calls[0][0].code).toBeNull()
  })
})

describe('vendor.service.remove', () => {
  test('destroys when present', async () => {
    const vendor = { destroy: jest.fn().mockResolvedValue() }
    Vendor.findByPk.mockResolvedValue(vendor)
    await service.remove('v1')
    expect(vendor.destroy).toHaveBeenCalled()
  })

  test('throws 404 when missing', async () => {
    Vendor.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Vendor not found' })
  })
})

describe('vendor.service.listAll', () => {
  test('returns only active vendors scoped to organization, ordered by name', async () => {
    Vendor.findAll.mockResolvedValue([{ id: 'v1', name: 'Acme' }])
    const out = await service.listAll('org-1')
    expect(out).toEqual([{ id: 'v1', name: 'Acme' }])
    expect(Vendor.findAll).toHaveBeenCalledWith({
      where: { status: 'active', organizationId: 'org-1' },
      order: [['name', 'ASC']],
    })
  })

  test('treats missing organization id as null tenant', async () => {
    Vendor.findAll.mockResolvedValue([])
    await service.listAll()
    expect(Vendor.findAll.mock.calls[0][0].where.organizationId).toBeNull()
  })
})
