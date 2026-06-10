// Unit tests for uom.service.
//
// UOM differs from store/customer/vendor in two ways: abbreviation is
// required on create (no autoCode path), and the duplicate-abbreviation
// check is *always* run on create (not gated behind a code field).

jest.mock('../../../../server/models', () => ({
  UOM: {
    findAndCountAll: jest.fn(),
    findByPk:        jest.fn(),
    findOne:         jest.fn(),
    create:          jest.fn(),
  },
}))

const { Op } = require('sequelize')
const { UOM } = require('../../../../server/models')
const service = require('../services/uom.service')

describe('uom.service.list', () => {
  beforeEach(() => {
    UOM.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
  })

  test('paginates and returns { total, page, limit, uoms }', async () => {
    UOM.findAndCountAll.mockResolvedValueOnce({ count: 5, rows: [{ id: 'u1' }] })
    const out = await service.list({ page: 2, limit: 2, organizationId: 'org-1' })
    expect(out).toEqual({ total: 5, page: 2, limit: 2, uoms: [{ id: 'u1' }] })

    const args = UOM.findAndCountAll.mock.calls[0][0]
    expect(args.offset).toBe(2)
    expect(args.where.organizationId).toBe('org-1')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['createdAt', 'DESC']])
  })

  test('search filters across name and abbreviation', async () => {
    await service.list({ search: 'kg', organizationId: 'org-1' })
    const or = UOM.findAndCountAll.mock.calls[0][0].where[Op.or]
    expect(or).toHaveLength(2)
    expect(or[0].name[Op.like]).toBe('%kg%')
    expect(or[1].abbreviation[Op.like]).toBe('%kg%')
  })
})

describe('uom.service.getById', () => {
  test('returns the row when found', async () => {
    UOM.findByPk.mockResolvedValue({ id: 'u1' })
    await expect(service.getById('u1')).resolves.toEqual({ id: 'u1' })
  })

  test('throws 404 when missing', async () => {
    UOM.findByPk.mockResolvedValue(null)
    await expect(service.getById('missing')).rejects.toEqual({ status: 404, message: 'UOM not found' })
  })
})

describe('uom.service.create', () => {
  test('rejects blank name', async () => {
    await expect(service.create({ name: '  ', abbreviation: 'kg' }))
      .rejects.toEqual({ status: 400, message: 'Name is required' })
    expect(UOM.create).not.toHaveBeenCalled()
  })

  test('rejects blank abbreviation', async () => {
    await expect(service.create({ name: 'Kilogram', abbreviation: '' }))
      .rejects.toEqual({ status: 400, message: 'Abbreviation is required' })
    expect(UOM.create).not.toHaveBeenCalled()
  })

  test('rejects when abbreviation already exists in the same organization', async () => {
    UOM.findOne.mockResolvedValue({ id: 'dup' })
    await expect(service.create({ name: 'Kilogram', abbreviation: 'kg', organizationId: 'org-1' }))
      .rejects.toEqual({ status: 400, message: 'UOM abbreviation already exists' })
    expect(UOM.findOne).toHaveBeenCalledWith({ where: { abbreviation: 'kg', organizationId: 'org-1' } })
    expect(UOM.create).not.toHaveBeenCalled()
  })

  test('trims name and abbreviation, coerces blank active range to null', async () => {
    UOM.findOne.mockResolvedValue(null)
    UOM.create.mockResolvedValue({ id: 'new' })
    await service.create({ name: '  Kilogram  ', abbreviation: '  kg  ', activeFrom: '', activeTo: '', userId: 'u1', organizationId: 'org-1' })
    const payload = UOM.create.mock.calls[0][0]
    expect(payload.name).toBe('Kilogram')
    expect(payload.abbreviation).toBe('kg')
    expect(payload.activeFrom).toBeNull()
    expect(payload.activeTo).toBeNull()
    expect(payload.status).toBe('active')
    expect(payload.createdBy).toBe('u1')
  })
})

describe('uom.service.update', () => {
  test('throws 404 when missing', async () => {
    UOM.findByPk.mockResolvedValue(null)
    await expect(service.update('missing', { name: 'x' })).rejects.toEqual({ status: 404, message: 'UOM not found' })
  })

  test('rejects abbreviation collision with another UOM from the same creator', async () => {
    const uom = { id: 'u1', createdBy: 'u-creator', update: jest.fn() }
    UOM.findByPk.mockResolvedValue(uom)
    UOM.findOne.mockResolvedValue({ id: 'u2' })
    await expect(service.update('u1', { abbreviation: 'dup' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'UOM abbreviation already exists' })
    expect(UOM.findOne).toHaveBeenCalledWith({ where: { abbreviation: 'dup', createdBy: 'u-creator' } })
    expect(uom.update).not.toHaveBeenCalled()
  })

  test('allows re-saving the same UOM with its own abbreviation', async () => {
    const uom = {
      id: 'u1', createdBy: 'u-creator',
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue({}),
    }
    UOM.findByPk.mockResolvedValue(uom)
    UOM.findOne.mockResolvedValue({ id: 'u1' }) // self
    await service.update('u1', { abbreviation: 'kg' }, 'u2')
    expect(uom.update).toHaveBeenCalled()
  })

  test('filters disallowed fields and coerces blank active range', async () => {
    const uom = {
      id: 'u1', createdBy: 'u-creator',
      update: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue({ id: 'u1', name: 'New' }),
    }
    UOM.findByPk.mockResolvedValue(uom)
    const out = await service.update('u1', {
      name: 'New',
      organizationId: 'attack',
      activeFrom: '',
      activeTo: '2026-01-01',
    }, 'u2')
    const patch = uom.update.mock.calls[0][0]
    expect(patch.name).toBe('New')
    expect(patch.activeFrom).toBeNull()
    expect(patch.activeTo).toBe('2026-01-01')
    expect(patch.modifiedBy).toBe('u2')
    expect(patch).not.toHaveProperty('organizationId')
    expect(out).toEqual({ id: 'u1', name: 'New' })
  })
})

describe('uom.service.remove', () => {
  test('destroys when present', async () => {
    const uom = { destroy: jest.fn().mockResolvedValue() }
    UOM.findByPk.mockResolvedValue(uom)
    await service.remove('u1')
    expect(uom.destroy).toHaveBeenCalled()
  })

  test('throws 404 when missing', async () => {
    UOM.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'UOM not found' })
  })
})
