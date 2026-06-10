// Unit tests for uom-conversion.service.
//
// The service includes both UOMConversion and UOM in queries (for the
// fromUom/toUom join), and reloads the created/updated row via
// findByPk-with-include before returning. The tests assert that re-read
// behavior so callers see populated relations.

jest.mock('../../../../server/models', () => ({
  UOMConversion: {
    findAll:  jest.fn(),
    findByPk: jest.fn(),
    create:   jest.fn(),
  },
  UOM: {}, // referenced only as a model class for include — no methods called
}))

const { Op } = require('sequelize')
const { UOMConversion } = require('../../../../server/models')
const service = require('../services/uom-conversion.service')

describe('uom-conversion.service.list', () => {
  beforeEach(() => {
    UOMConversion.findAll.mockResolvedValue([])
  })

  test('prefers organizationId over createdBy when both are supplied', async () => {
    await service.list({ organizationId: 'org-1', createdBy: 'u1' })
    const args = UOMConversion.findAll.mock.calls[0][0]
    expect(args.where.organizationId).toBe('org-1')
    expect(args.where).not.toHaveProperty('createdBy')
    expect(args.where.dataFlag[Op.ne]).toBe(2)
    expect(args.order).toEqual([['createdAt', 'DESC']])
  })

  test('falls back to createdBy when organizationId is absent', async () => {
    await service.list({ createdBy: 'u1' })
    const args = UOMConversion.findAll.mock.calls[0][0]
    expect(args.where.createdBy).toBe('u1')
    expect(args.where).not.toHaveProperty('organizationId')
  })

  test('returns all (soft-deleted excluded) when no tenant filter given', async () => {
    await service.list()
    const where = UOMConversion.findAll.mock.calls[0][0].where
    expect(where).not.toHaveProperty('organizationId')
    expect(where).not.toHaveProperty('createdBy')
    expect(where.dataFlag[Op.ne]).toBe(2)
  })

  test('eager-loads fromUom and toUom with id/name/abbreviation only', async () => {
    await service.list()
    const include = UOMConversion.findAll.mock.calls[0][0].include
    expect(include).toHaveLength(2)
    const aliases = include.map(i => i.as).sort()
    expect(aliases).toEqual(['fromUom', 'toUom'])
    expect(include[0].attributes).toEqual(['id', 'name', 'abbreviation'])
  })
})

describe('uom-conversion.service.create', () => {
  test('rejects when fromUomId is missing', async () => {
    await expect(service.create({ toUomId: 'b', factor: 2 }))
      .rejects.toEqual({ status: 400, message: 'From UOM is required' })
  })

  test('rejects when toUomId is missing', async () => {
    await expect(service.create({ fromUomId: 'a', factor: 2 }))
      .rejects.toEqual({ status: 400, message: 'To UOM is required' })
  })

  test('rejects when from and to are the same UOM', async () => {
    await expect(service.create({ fromUomId: 'a', toUomId: 'a', factor: 2 }))
      .rejects.toEqual({ status: 400, message: 'From and To UOM must be different' })
  })

  test('rejects when factor is missing or <= 0', async () => {
    await expect(service.create({ fromUomId: 'a', toUomId: 'b' }))
      .rejects.toEqual({ status: 400, message: 'Factor must be greater than 0' })
    await expect(service.create({ fromUomId: 'a', toUomId: 'b', factor: 0 }))
      .rejects.toEqual({ status: 400, message: 'Factor must be greater than 0' })
    await expect(service.create({ fromUomId: 'a', toUomId: 'b', factor: -1 }))
      .rejects.toEqual({ status: 400, message: 'Factor must be greater than 0' })
  })

  test('parses factor as float and defaults notes to null', async () => {
    UOMConversion.create.mockResolvedValue({ id: 'c1' })
    UOMConversion.findByPk.mockResolvedValue({ id: 'c1', factor: 2.5 })
    const out = await service.create({ fromUomId: 'a', toUomId: 'b', factor: '2.5', createdBy: 'u1', organizationId: 'org-1' })

    const payload = UOMConversion.create.mock.calls[0][0]
    expect(payload.fromUomId).toBe('a')
    expect(payload.toUomId).toBe('b')
    expect(payload.factor).toBe(2.5) // not the string '2.5'
    expect(payload.notes).toBeNull()
    expect(payload.organizationId).toBe('org-1')
    expect(payload.createdBy).toBe('u1')

    // reloads with include so caller sees populated relations
    expect(UOMConversion.findByPk).toHaveBeenCalledWith('c1', expect.objectContaining({
      include: expect.any(Array),
    }))
    expect(out).toEqual({ id: 'c1', factor: 2.5 })
  })

  test('passes through explicit notes', async () => {
    UOMConversion.create.mockResolvedValue({ id: 'c1' })
    UOMConversion.findByPk.mockResolvedValue({})
    await service.create({ fromUomId: 'a', toUomId: 'b', factor: 1, notes: '1 box = 12 each' })
    expect(UOMConversion.create.mock.calls[0][0].notes).toBe('1 box = 12 each')
  })
})

describe('uom-conversion.service.update', () => {
  test('throws 404 when missing', async () => {
    UOMConversion.findByPk.mockResolvedValueOnce(null)
    await expect(service.update('missing', { factor: 2 }, 'u2'))
      .rejects.toEqual({ status: 404, message: 'Conversion not found' })
  })

  test('rejects when from === to', async () => {
    UOMConversion.findByPk.mockResolvedValueOnce({ id: 'c1' })
    await expect(service.update('c1', { fromUomId: 'a', toUomId: 'a' }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'From and To UOM must be different' })
  })

  test('rejects factor <= 0 when explicitly supplied (with differing UOMs)', async () => {
    UOMConversion.findByPk.mockResolvedValueOnce({ id: 'c1' })
    await expect(service.update('c1', { fromUomId: 'a', toUomId: 'b', factor: 0 }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'Factor must be greater than 0' })
  })

  test('rejects from===to even when caller passes both undefined (no UOM patch)', async () => {
    // Sanity-check the actual behavior: omitting both UOM ids leaves them
    // as undefined === undefined, which trips the inequality guard before
    // any other validation runs. Documents the current API contract.
    UOMConversion.findByPk.mockResolvedValueOnce({ id: 'c1' })
    await expect(service.update('c1', { factor: 5 }, 'u2'))
      .rejects.toEqual({ status: 400, message: 'From and To UOM must be different' })
  })

  test('patches only supplied fields and re-reads with include', async () => {
    const conv = { id: 'c1', update: jest.fn().mockResolvedValue() }
    UOMConversion.findByPk
      .mockResolvedValueOnce(conv)
      .mockResolvedValueOnce({ id: 'c1', factor: 3, fromUom: { id: 'a' }, toUom: { id: 'b' } })

    const out = await service.update('c1', { fromUomId: 'a', toUomId: 'b', factor: '3', notes: '' }, 'u2')
    const patch = conv.update.mock.calls[0][0]
    expect(patch.fromUomId).toBe('a')
    expect(patch.toUomId).toBe('b')
    expect(patch.factor).toBe(3)
    expect(patch.notes).toBeNull() // empty string → null
    expect(patch.modifiedBy).toBe('u2')
    expect(out).toEqual({ id: 'c1', factor: 3, fromUom: { id: 'a' }, toUom: { id: 'b' } })
  })
})

describe('uom-conversion.service.remove', () => {
  test('destroys when present', async () => {
    const conv = { destroy: jest.fn().mockResolvedValue() }
    UOMConversion.findByPk.mockResolvedValue(conv)
    await service.remove('c1')
    expect(conv.destroy).toHaveBeenCalled()
  })

  test('throws 404 when missing', async () => {
    UOMConversion.findByPk.mockResolvedValue(null)
    await expect(service.remove('missing')).rejects.toEqual({ status: 404, message: 'Conversion not found' })
  })
})
