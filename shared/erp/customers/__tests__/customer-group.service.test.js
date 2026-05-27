// Unit tests for customer-group.service.
//
// Same shape as customer.service tests — mock the Sequelize facade and the
// sequence service so the suite is fully isolated from the database.

jest.mock('../../../../server/models', () => ({
  CustomerGroup: {
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
const { CustomerGroup } = require('../../../../server/models')
const seqSvc = require('../../settings/services/sequence.service')
const service = require('../services/customer-group.service')

describe('customer-group.service.list', () => {
  test('paginates and excludes soft-deleted rows', async () => {
    CustomerGroup.findAndCountAll.mockResolvedValue({ count: 3, rows: [{ id: 'g1' }] })
    const out = await service.list({ page: 3, limit: 5, organizationId: 'org-1' })
    expect(out).toEqual({ total: 3, page: 3, limit: 5, groups: [{ id: 'g1' }] })

    const args = CustomerGroup.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(10)
    expect(args.where.organizationId).toBe('org-1')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['name', 'ASC']])
  })

  test('search filters on the name column only', async () => {
    CustomerGroup.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
    await service.list({ search: 'vip', organizationId: 'org-1' })
    const args = CustomerGroup.findAndCountAll.mock.calls[0][0]
    expect(args.where.name[Op.like]).toBe('%vip%')
  })
})

describe('customer-group.service.listAll', () => {
  test('returns only active rows scoped to organization', async () => {
    CustomerGroup.findAll.mockResolvedValue([{ id: 'g1', status: 'active' }])
    const out = await service.listAll('org-1')
    expect(out).toEqual([{ id: 'g1', status: 'active' }])
    expect(CustomerGroup.findAll).toHaveBeenCalledWith({
      where: { status: 'active', organizationId: 'org-1' },
      order: [['name', 'ASC']],
    })
  })
})

describe('customer-group.service.getById', () => {
  test('throws 404 when missing', async () => {
    CustomerGroup.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'Customer group not found' })
  })

  test('returns the row when found', async () => {
    CustomerGroup.findByPk.mockResolvedValue({ id: 'g1' })
    await expect(service.getById('g1')).resolves.toEqual({ id: 'g1' })
  })
})

describe('customer-group.service.create', () => {
  test('rejects blank names', async () => {
    await expect(service.create({ name: '   ' })).rejects.toEqual({ status: 400, message: 'Name is required' })
    expect(CustomerGroup.create).not.toHaveBeenCalled()
  })

  test('uses the sequence when autoCode is true', async () => {
    seqSvc.getNext.mockResolvedValue('CGP-0001')
    CustomerGroup.create.mockResolvedValue({ id: 'g1' })
    await service.create({ name: 'VIP', autoCode: true, userId: 'u1' })
    expect(seqSvc.getNext).toHaveBeenCalledWith('CGP', 'u1')
    expect(CustomerGroup.create.mock.calls[0][0].code).toBe('CGP-0001')
  })

  test('rejects when a duplicate code exists within the same organization', async () => {
    CustomerGroup.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'VIP', code: 'V', organizationId: 'org-1' }))
      .rejects.toEqual({ status: 400, message: 'Customer group code already exists' })
    expect(CustomerGroup.findOne).toHaveBeenCalledWith({
      where: { code: 'V', organizationId: 'org-1' },
    })
  })

  test('passes through trimmed values and defaults', async () => {
    CustomerGroup.create.mockResolvedValue({ id: 'g1' })
    await service.create({ name: '  VIP  ', userId: 'u1', organizationId: 'org-1' })
    const payload = CustomerGroup.create.mock.calls[0][0]
    expect(payload.name).toBe('VIP')
    expect(payload.code).toBeNull()
    expect(payload.status).toBe('active')
    expect(payload.organizationId).toBe('org-1')
    expect(payload.activeFrom).toBeNull()
    expect(payload.activeTo).toBeNull()
  })
})

describe('customer-group.service.update', () => {
  test('throws 404 when not found', async () => {
    CustomerGroup.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' })).rejects.toEqual({ status: 404, message: 'Customer group not found' })
  })

  test('filters disallowed fields and undefined values', async () => {
    const reloaded = { id: 'g1', name: 'New' }
    const group = {
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue(reloaded),
    }
    CustomerGroup.findByPk.mockResolvedValue(group)
    const out = await service.update('g1', {
      name: 'New',
      description: 'desc',
      organizationId: 'attack', // not in allowed list
      activeFrom: undefined,
    }, 'u1')
    const patch = group.update.mock.calls[0][0]
    expect(patch.name).toBe('New')
    expect(patch.description).toBe('desc')
    expect(patch).not.toHaveProperty('organizationId')
    expect(patch).not.toHaveProperty('activeFrom') // undefined filtered out
    expect(patch.modifiedBy).toBe('u1')
    expect(out).toBe(reloaded)
  })

  test('coerces empty active range strings to null', async () => {
    const group = {
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue({}),
    }
    CustomerGroup.findByPk.mockResolvedValue(group)
    await service.update('g1', { activeFrom: '', activeTo: '' }, 'u1')
    const patch = group.update.mock.calls[0][0]
    expect(patch.activeFrom).toBeNull()
    expect(patch.activeTo).toBeNull()
  })
})

describe('customer-group.service.remove', () => {
  test('destroys when present', async () => {
    const group = { destroy: jest.fn().mockResolvedValue() }
    CustomerGroup.findByPk.mockResolvedValue(group)
    await service.remove('g1')
    expect(group.destroy).toHaveBeenCalled()
  })

  test('throws 404 when missing', async () => {
    CustomerGroup.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Customer group not found' })
  })
})
