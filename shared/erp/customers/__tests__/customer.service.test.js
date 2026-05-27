// Unit tests for customer.service.
//
// The service depends on Sequelize models loaded from server/models. To keep
// these tests fast and DB-free we mock that module wholesale and assert on
// the calls the service makes against the model facade.

jest.mock('../../../../server/models', () => ({
  Customer:      { findAndCountAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  CustomerGroup: {},
}))

// Sequence service is only required inside the service when autoCode is true,
// so we mock the specific path the service `require`s lazily.
jest.mock('../../settings/services/sequence.service', () => ({
  getNext: jest.fn(),
}), { virtual: true })

const { Op } = require('sequelize')
const { Customer } = require('../../../../server/models')
const seqSvc = require('../../settings/services/sequence.service')
const service = require('../services/customer.service')

describe('customer.service.list', () => {
  beforeEach(() => {
    Customer.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates and returns shape { total, page, limit, customers }', async () => {
    Customer.findAndCountAll.mockResolvedValueOnce({ count: 42, rows: [{ id: 'a' }] })
    const out = await service.list({ page: 2, limit: 10, organizationId: 'org-1' })
    expect(out).toEqual({ total: 42, page: 2, limit: 10, customers: [{ id: 'a' }] })

    const args = Customer.findAndCountAll.mock.calls[0][0]
    expect(args.limit).toBe(10)
    expect(args.offset).toBe(10) // (page-1)*limit
    expect(args.where.organizationId).toBe('org-1')
    // soft-deleted records (dataFlag === 2) are excluded
    expect(args.where.dataFlag[Op.ne]).toBe(2)
  })

  test('applies search across name/email/company via OR', async () => {
    await service.list({ search: 'acme', organizationId: 'org-1' })
    const args = Customer.findAndCountAll.mock.calls[0][0]
    const orClause = args.where[Op.or]
    expect(orClause).toHaveLength(3)
    expect(orClause[0].name[Op.like]).toBe('%acme%')
    expect(orClause[1].email[Op.like]).toBe('%acme%')
    expect(orClause[2].company[Op.like]).toBe('%acme%')
  })

  test('applies groupId/status/activeFrom/activeTo filters only when provided', async () => {
    await service.list({ groupId: 'g1', status: 'active', activeFrom: '2025-01-01', activeTo: '2025-12-31', organizationId: 'org-1' })
    const args = Customer.findAndCountAll.mock.calls[0][0]
    expect(args.where.customerGroupId).toBe('g1')
    expect(args.where.status).toBe('active')
    expect(args.where.activeFrom[Op.gte]).toBe('2025-01-01')
    expect(args.where.activeTo[Op.lte]).toBe('2025-12-31')
  })

  test('treats missing organizationId as null tenant', async () => {
    await service.list({})
    const args = Customer.findAndCountAll.mock.calls[0][0]
    expect(args.where.organizationId).toBeNull()
  })
})

describe('customer.service.getById', () => {
  test('returns the customer when found', async () => {
    Customer.findByPk.mockResolvedValue({ id: '1', name: 'Acme' })
    const out = await service.getById('1')
    expect(out).toEqual({ id: '1', name: 'Acme' })
    expect(Customer.findByPk).toHaveBeenCalledWith('1', expect.objectContaining({
      include: expect.any(Array),
    }))
  })

  test('throws 404 when not found', async () => {
    Customer.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Customer not found' })
  })
})

describe('customer.service.create', () => {
  test('rejects when name is missing or blank', async () => {
    await expect(service.create({ name: '' })).rejects.toEqual({ status: 400, message: 'Name is required' })
    await expect(service.create({ name: '   ' })).rejects.toEqual({ status: 400, message: 'Name is required' })
    expect(Customer.create).not.toHaveBeenCalled()
  })

  test('trims the name and persists null code when no code is supplied', async () => {
    Customer.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: '  Acme  ', userId: 'u1', organizationId: 'org-1' })
    const payload = Customer.create.mock.calls[0][0]
    expect(payload.name).toBe('Acme')
    expect(payload.code).toBeNull()
    expect(payload.createdBy).toBe('u1')
    expect(payload.modifiedBy).toBe('u1')
    expect(payload.organizationId).toBe('org-1')
  })

  test('uses sequence service when autoCode is true', async () => {
    seqSvc.getNext.mockResolvedValue('CUS-0007')
    Customer.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: 'Acme', autoCode: true, userId: 'u1' })
    expect(seqSvc.getNext).toHaveBeenCalledWith('CUS', 'u1')
    expect(Customer.create.mock.calls[0][0].code).toBe('CUS-0007')
  })

  test('rejects when an explicit code already exists', async () => {
    Customer.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'Acme', code: 'C-1' }))
      .rejects.toEqual({ status: 400, message: 'Customer code already exists' })
    expect(Customer.create).not.toHaveBeenCalled()
  })

  test('uses trimmed explicit code when available', async () => {
    Customer.findOne.mockResolvedValue(null)
    Customer.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: 'Acme', code: '  C-9  ' })
    expect(Customer.create.mock.calls[0][0].code).toBe('C-9')
  })

  test('coerces empty active range strings to null', async () => {
    Customer.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: 'Acme', activeFrom: '', activeTo: '' })
    const payload = Customer.create.mock.calls[0][0]
    expect(payload.activeFrom).toBeNull()
    expect(payload.activeTo).toBeNull()
  })
})

describe('customer.service.update', () => {
  test('throws 404 when the row is missing', async () => {
    Customer.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' })).rejects.toEqual({ status: 404, message: 'Customer not found' })
  })

  test('only applies allowed fields and ignores undefined values', async () => {
    const reloaded = { id: '1', name: 'Acme' }
    const customer = {
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue(reloaded),
    }
    Customer.findByPk.mockResolvedValue(customer)

    const result = await service.update('1', {
      name: 'New name',
      email: 'a@b.com',
      hacker: 'should be stripped',
      notes: undefined, // undefined should be filtered out
    }, 'u2')

    const patch = customer.update.mock.calls[0][0]
    expect(patch.name).toBe('New name')
    expect(patch.email).toBe('a@b.com')
    expect(patch.modifiedBy).toBe('u2')
    expect(patch).not.toHaveProperty('hacker')
    expect(patch).not.toHaveProperty('notes')
    expect(result).toBe(reloaded)
  })

  test('normalises empty strings on customerGroupId / activeFrom / activeTo to null', async () => {
    const customer = {
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue({}),
    }
    Customer.findByPk.mockResolvedValue(customer)
    await service.update('1', { customerGroupId: '', activeFrom: '', activeTo: '' }, 'u2')
    const patch = customer.update.mock.calls[0][0]
    expect(patch.customerGroupId).toBeNull()
    expect(patch.activeFrom).toBeNull()
    expect(patch.activeTo).toBeNull()
  })
})

describe('customer.service.remove', () => {
  test('destroys the row when present', async () => {
    const customer = { destroy: jest.fn().mockResolvedValue() }
    Customer.findByPk.mockResolvedValue(customer)
    await service.remove('1')
    expect(customer.destroy).toHaveBeenCalled()
  })

  test('throws 404 when missing', async () => {
    Customer.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Customer not found' })
  })
})
