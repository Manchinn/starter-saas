// Unit tests for the Vendors AI tool handlers. The handlers lazily `require`
// the vendor service, so we mock that module path and drive each tool's handler
// directly with a fake user ctx.
jest.mock('../vendor.service', () => ({
  list: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}))

const vendorSvc = require('../vendor.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('vendors ai-tools — registry', () => {
  test('exposes the full toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'create_vendor', 'delete_vendor', 'get_vendor', 'list_vendors', 'update_vendor',
    ])
    expect(navTargets).toHaveProperty('vendors_list')
    expect(navTargets).toHaveProperty('vendor_create')
  })

  test('every tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })
})

describe('create_vendor', () => {
  test('auto-codes when no code is given and passes vendor types', async () => {
    vendorSvc.create.mockResolvedValue({ id: 'v1', name: 'Acme Supply', code: 'VND-1' })
    const { result, action } = await byName.create_vendor.handler(
      { name: 'Acme Supply', email: 'a@acme.com', vendorTypes: ['raw', 'service'] }, ctx,
    )
    expect(vendorSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Acme Supply', autoCode: true, email: 'a@acme.com',
      vendorTypes: ['raw', 'service'], userId: 'u1', organizationId: 'o1',
    }))
    expect(result).toMatchObject({ id: 'v1', code: 'VND-1' })
    expect(action.path).toBe('/erp/vendors/v1/edit')
  })

  test('keeps a provided code (no auto-code)', async () => {
    vendorSvc.create.mockResolvedValue({ id: 'v2', name: 'Beta', code: 'BK' })
    await byName.create_vendor.handler({ name: 'Beta', code: 'BK' }, ctx)
    expect(vendorSvc.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'BK', autoCode: false }))
  })
})

describe('list_vendors', () => {
  test('passes filters and clamps the limit', async () => {
    vendorSvc.list.mockResolvedValue({ total: 1, vendors: [{ id: 'v1', name: 'Acme', code: 'VND-1', status: 'active', vendorTypes: ['raw'] }] })
    const { result, action } = await byName.list_vendors.handler({ search: 'ac', status: 'active', limit: 999 }, ctx)
    expect(vendorSvc.list).toHaveBeenCalledWith(expect.objectContaining({
      search: 'ac', status: 'active', limit: 50, organizationId: 'o1',
    }))
    expect(result.vendors[0]).toMatchObject({ name: 'Acme', vendorTypes: ['raw'] })
    expect(action.path).toBe('/erp/vendors')
  })
})

describe('get_vendor — resolution', () => {
  test('returns full detail on a unique match', async () => {
    vendorSvc.list.mockResolvedValue({ vendors: [{ id: 'v1', name: 'Acme', code: 'VND-1', address: '1 St', notes: 'hi' }] })
    const { result, action } = await byName.get_vendor.handler({ search: 'Acme' }, ctx)
    expect(result).toMatchObject({ id: 'v1', address: '1 St', notes: 'hi' })
    expect(action.path).toBe('/erp/vendors/v1/edit')
  })

  test('reports when nothing matches', async () => {
    vendorSvc.list.mockResolvedValue({ vendors: [] })
    const { result, action } = await byName.get_vendor.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No vendor matches/)
    expect(action).toBeUndefined()
  })

  test('disambiguates by exact match, else asks to narrow', async () => {
    vendorSvc.list.mockResolvedValue({ vendors: [{ id: 'v1', name: 'Acme', code: 'VND-1' }, { id: 'v2', name: 'Acme Corp', code: 'VND-2' }] })
    const exact = await byName.get_vendor.handler({ search: 'acme' }, ctx)
    expect(exact.result).toMatchObject({ id: 'v1' })

    vendorSvc.list.mockResolvedValue({ vendors: [{ id: 'v1', name: 'Acme One' }, { id: 'v2', name: 'Acme Two' }] })
    const ambiguous = await byName.get_vendor.handler({ search: 'acme' }, ctx)
    expect(ambiguous.result).toMatch(/Multiple vendors match/)
  })
})

describe('update_vendor', () => {
  test('updates only passed fields', async () => {
    vendorSvc.list.mockResolvedValue({ vendors: [{ id: 'v1', name: 'Acme', code: 'VND-1' }] })
    vendorSvc.update.mockResolvedValue({ id: 'v1', name: 'Acme', code: 'VND-1' })
    const { result } = await byName.update_vendor.handler({ search: 'VND-1', phone: '555', vendorTypes: ['service'] }, ctx)
    expect(vendorSvc.update).toHaveBeenCalledWith('v1', { phone: '555', vendorTypes: ['service'] }, 'u1', 'o1')
    expect(result.updated).toEqual(expect.arrayContaining(['phone', 'vendorTypes']))
  })

  test('no fields → does not call update', async () => {
    vendorSvc.list.mockResolvedValue({ vendors: [{ id: 'v1', name: 'Acme' }] })
    const { result } = await byName.update_vendor.handler({ search: 'Acme' }, ctx)
    expect(vendorSvc.update).not.toHaveBeenCalled()
    expect(result).toMatch(/Nothing to update/)
  })
})

describe('delete_vendor', () => {
  test('removes a uniquely-resolved vendor', async () => {
    vendorSvc.list.mockResolvedValue({ vendors: [{ id: 'v1', name: 'Acme', code: 'VND-1' }] })
    vendorSvc.remove.mockResolvedValue()
    const { result, action } = await byName.delete_vendor.handler({ search: 'Acme' }, ctx)
    expect(vendorSvc.remove).toHaveBeenCalledWith('v1', 'o1')
    expect(result).toMatch(/Deleted vendor Acme \(VND-1\)/)
    expect(action.path).toBe('/erp/vendors')
  })

  test('does not delete when ambiguous', async () => {
    vendorSvc.list.mockResolvedValue({ vendors: [{ id: 'v1', name: 'Acme One' }, { id: 'v2', name: 'Acme Two' }] })
    const { result } = await byName.delete_vendor.handler({ search: 'acme' }, ctx)
    expect(vendorSvc.remove).not.toHaveBeenCalled()
    expect(result).toMatch(/Multiple vendors match/)
  })
})
