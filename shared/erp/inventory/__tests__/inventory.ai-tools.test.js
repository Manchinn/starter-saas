// Unit tests for the Inventory AI tool handlers (stores, UOMs, UOM
// conversions). Handlers lazily `require` their services, so we mock those
// module paths and drive each tool's handler directly with a fake user ctx.
jest.mock('../services/store.service', () => ({
  list: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}))
jest.mock('../services/uom.service', () => ({
  list: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}))
jest.mock('../services/uom-conversion.service', () => ({
  list: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}))

const storeSvc = require('../services/store.service')
const uomSvc   = require('../services/uom.service')
const convSvc  = require('../services/uom-conversion.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('inventory ai-tools — registry', () => {
  test('exposes the full toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'create_store', 'create_uom', 'create_uom_conversion',
      'delete_store', 'delete_uom', 'delete_uom_conversion',
      'get_store', 'get_uom',
      'list_stores', 'list_uom_conversions', 'list_uoms',
      'update_store', 'update_uom', 'update_uom_conversion',
    ])
    for (const key of ['stores_list', 'uoms_list', 'uom_conversions_list']) {
      expect(navTargets).toHaveProperty(key)
    }
  })

  test('every tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })
})

describe('stores', () => {
  test('create_store auto-codes when no code is given', async () => {
    storeSvc.create.mockResolvedValue({ id: 's1', name: 'Main', code: 'WHS-1' })
    const { result, action } = await byName.create_store.handler({ name: 'Main' }, ctx)
    expect(storeSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Main', autoCode: true, userId: 'u1', organizationId: 'o1',
    }))
    expect(result).toMatchObject({ id: 's1', code: 'WHS-1' })
    expect(action.path).toBe('/erp/stores/s1/edit')
  })

  test('create_store keeps a provided code (no auto-code)', async () => {
    storeSvc.create.mockResolvedValue({ id: 's2', name: 'Back', code: 'BK' })
    await byName.create_store.handler({ name: 'Back', code: 'BK' }, ctx)
    expect(storeSvc.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'BK', autoCode: false }))
  })

  test('list_stores clamps the limit and slims rows', async () => {
    storeSvc.list.mockResolvedValue({ total: 1, stores: [{ id: 's1', name: 'Main', code: 'WHS-1', status: 'active' }] })
    const { result, action } = await byName.list_stores.handler({ search: 'ma', limit: 999 }, ctx)
    expect(storeSvc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'ma', limit: 50, organizationId: 'o1' }))
    expect(result.stores[0]).toMatchObject({ name: 'Main', code: 'WHS-1' })
    expect(action.path).toBe('/erp/stores')
  })

  test('update_store updates only passed fields', async () => {
    storeSvc.list.mockResolvedValue({ stores: [{ id: 's1', name: 'Main', code: 'WHS-1' }] })
    storeSvc.update.mockResolvedValue({ id: 's1', name: 'Main', code: 'WHS-1' })
    const { result } = await byName.update_store.handler({ search: 'WHS-1', phone: '555' }, ctx)
    expect(storeSvc.update).toHaveBeenCalledWith('s1', { phone: '555' }, 'u1', 'o1')
    expect(result.updated).toEqual(['phone'])
  })

  test('delete_store reports ambiguity without deleting', async () => {
    storeSvc.list.mockResolvedValue({ stores: [{ id: 's1', name: 'Main One' }, { id: 's2', name: 'Main Two' }] })
    const { result } = await byName.delete_store.handler({ search: 'main' }, ctx)
    expect(storeSvc.remove).not.toHaveBeenCalled()
    expect(result).toMatch(/Multiple stores match/)
  })
})

describe('uoms', () => {
  test('create_uom passes name + abbreviation', async () => {
    uomSvc.create.mockResolvedValue({ id: 'm1', name: 'Kilogram', abbreviation: 'kg' })
    const { result, action } = await byName.create_uom.handler({ name: 'Kilogram', abbreviation: 'kg' }, ctx)
    expect(uomSvc.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Kilogram', abbreviation: 'kg', organizationId: 'o1' }))
    expect(result).toMatchObject({ abbreviation: 'kg' })
    expect(action.path).toBe('/erp/uom/m1/edit')
  })

  test('get_uom resolves by abbreviation', async () => {
    uomSvc.list.mockResolvedValue({ uoms: [{ id: 'm1', name: 'Kilogram', abbreviation: 'kg', status: 'active' }] })
    const { result } = await byName.get_uom.handler({ search: 'kg' }, ctx)
    expect(result).toMatchObject({ id: 'm1', abbreviation: 'kg' })
  })

  test('delete_uom removes a uniquely-resolved unit', async () => {
    uomSvc.list.mockResolvedValue({ uoms: [{ id: 'm1', name: 'Kilogram', abbreviation: 'kg' }] })
    uomSvc.remove.mockResolvedValue()
    const { result, action } = await byName.delete_uom.handler({ search: 'Kilogram' }, ctx)
    expect(uomSvc.remove).toHaveBeenCalledWith('m1', 'o1')
    expect(result).toMatch(/Deleted unit Kilogram \(kg\)/)
    expect(action.path).toBe('/erp/uom')
  })
})

describe('uom conversions', () => {
  test('create resolves both units to ids', async () => {
    uomSvc.list
      .mockResolvedValueOnce({ uoms: [{ id: 'box', name: 'Box', abbreviation: 'bx' }] })
      .mockResolvedValueOnce({ uoms: [{ id: 'pc', name: 'Piece', abbreviation: 'pc' }] })
    convSvc.create.mockResolvedValue({ id: 'cv1', fromUom: { abbreviation: 'bx' }, toUom: { abbreviation: 'pc' }, factor: 12 })

    const { result, action } = await byName.create_uom_conversion.handler({ fromUom: 'box', toUom: 'piece', factor: 12 }, ctx)
    expect(convSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      fromUomId: 'box', toUomId: 'pc', factor: 12, createdBy: 'u1', organizationId: 'o1',
    }))
    expect(result).toMatchObject({ from: 'bx', to: 'pc', factor: 12 })
    expect(action.path).toBe('/erp/uom-conversion/cv1/edit')
  })

  test('create reports when a unit is unknown', async () => {
    uomSvc.list.mockResolvedValueOnce({ uoms: [] }) // fromUom not found
    const { result } = await byName.create_uom_conversion.handler({ fromUom: 'ghost', toUom: 'pc', factor: 2 }, ctx)
    expect(result).toMatch(/No unit of measure matches/)
    expect(convSvc.create).not.toHaveBeenCalled()
  })

  test('update resolves the conversion by its unit pair', async () => {
    uomSvc.list
      .mockResolvedValueOnce({ uoms: [{ id: 'box', name: 'Box', abbreviation: 'bx' }] })
      .mockResolvedValueOnce({ uoms: [{ id: 'pc', name: 'Piece', abbreviation: 'pc' }] })
    convSvc.list.mockResolvedValue([{ id: 'cv1', fromUomId: 'box', toUomId: 'pc', factor: 12 }])
    convSvc.update.mockResolvedValue({ id: 'cv1', fromUom: { abbreviation: 'bx' }, toUom: { abbreviation: 'pc' }, factor: 10 })

    const { result } = await byName.update_uom_conversion.handler({ fromUom: 'bx', toUom: 'pc', factor: 10 }, ctx)
    expect(convSvc.update).toHaveBeenCalledWith('cv1', { factor: 10, notes: undefined }, 'u1', 'o1')
    expect(result).toMatchObject({ factor: 10 })
  })

  test('delete reports when the pair has no conversion', async () => {
    uomSvc.list
      .mockResolvedValueOnce({ uoms: [{ id: 'box', name: 'Box', abbreviation: 'bx' }] })
      .mockResolvedValueOnce({ uoms: [{ id: 'pc', name: 'Piece', abbreviation: 'pc' }] })
    convSvc.list.mockResolvedValue([]) // no matching conversion
    const { result } = await byName.delete_uom_conversion.handler({ fromUom: 'bx', toUom: 'pc' }, ctx)
    expect(convSvc.remove).not.toHaveBeenCalled()
    expect(result).toMatch(/No conversion from bx to pc exists/)
  })
})
