// Unit tests for the Customers AI tool handlers. The handlers lazily
// `require` the customer + customer-group services, so we mock those module
// paths and drive each tool's handler directly with a fake user ctx.
jest.mock('../services/customer.service', () => ({
  list: jest.fn(), getById: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
}))
jest.mock('../services/customer-group.service', () => ({
  list: jest.fn(), listAll: jest.fn(), create: jest.fn(),
}))

const customerSvc = require('../services/customer.service')
const groupSvc    = require('../services/customer-group.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('customers ai-tools — registry', () => {
  test('exposes the full toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'create_customer', 'create_customer_group', 'delete_customer',
      'get_customer', 'list_customer_groups', 'list_customers', 'update_customer',
    ])
    expect(navTargets).toHaveProperty('customers_list')
    expect(navTargets).toHaveProperty('customer_groups_list')
  })

  test('every tool is server-kind with a handler and required fields declared', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })
})

describe('create_customer', () => {
  test('auto-codes and resolves a group name to its id', async () => {
    groupSvc.listAll.mockResolvedValue([{ id: 'g1', name: 'VIP' }, { id: 'g2', name: 'Wholesale' }])
    customerSvc.create.mockResolvedValue({ id: 'c1', name: 'Acme', code: 'CUS-1' })

    const { result, action } = await byName.create_customer.handler(
      { name: 'Acme', email: 'a@acme.com', group: 'vip' }, ctx,
    )

    expect(customerSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Acme', autoCode: true, email: 'a@acme.com',
      customerGroupId: 'g1', userId: 'u1', organizationId: 'o1',
    }))
    expect(result).toMatchObject({ id: 'c1', code: 'CUS-1' })
    expect(action).toMatchObject({ type: 'navigate', path: '/erp/customers/c1/edit' })
  })

  test('unknown group name resolves to null (not an error)', async () => {
    groupSvc.listAll.mockResolvedValue([{ id: 'g1', name: 'VIP' }])
    customerSvc.create.mockResolvedValue({ id: 'c2', name: 'Beta', code: 'CUS-2' })

    await byName.create_customer.handler({ name: 'Beta', group: 'nope' }, ctx)
    expect(customerSvc.create).toHaveBeenCalledWith(expect.objectContaining({ customerGroupId: null }))
  })
})

describe('list_customers', () => {
  test('passes filters and clamps the limit', async () => {
    customerSvc.list.mockResolvedValue({ total: 1, customers: [{ id: 'c1', name: 'Acme', group: { name: 'VIP' } }] })
    const { result, action } = await byName.list_customers.handler({ search: 'ac', status: 'active', limit: 999 }, ctx)

    expect(customerSvc.list).toHaveBeenCalledWith(expect.objectContaining({
      search: 'ac', status: 'active', limit: 50, organizationId: 'o1',
    }))
    expect(result.total).toBe(1)
    expect(result.customers[0]).toMatchObject({ name: 'Acme', group: 'VIP' })
    expect(action.path).toBe('/erp/customers')
  })
})

describe('get_customer — resolution', () => {
  test('returns full detail on a unique match', async () => {
    customerSvc.list.mockResolvedValue({ customers: [{ id: 'c1', name: 'Acme', code: 'CUS-1', address: '1 St', notes: 'hi' }] })
    const { result, action } = await byName.get_customer.handler({ search: 'Acme' }, ctx)
    expect(result).toMatchObject({ id: 'c1', address: '1 St', notes: 'hi' })
    expect(action.path).toBe('/erp/customers/c1/edit')
  })

  test('reports when nothing matches', async () => {
    customerSvc.list.mockResolvedValue({ customers: [] })
    const { result, action } = await byName.get_customer.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No customer matches/)
    expect(action).toBeUndefined()
  })

  test('disambiguates multiple matches by exact name, else asks to narrow', async () => {
    customerSvc.list.mockResolvedValue({ customers: [
      { id: 'c1', name: 'Acme', code: 'CUS-1' },
      { id: 'c2', name: 'Acme Corp', code: 'CUS-2' },
    ] })
    // exact (case-insensitive) name hit → resolves to c1
    const exact = await byName.get_customer.handler({ search: 'acme' }, ctx)
    expect(exact.result).toMatchObject({ id: 'c1' })

    customerSvc.list.mockResolvedValue({ customers: [
      { id: 'c1', name: 'Acme One', code: 'CUS-1' },
      { id: 'c2', name: 'Acme Two', code: 'CUS-2' },
    ] })
    const ambiguous = await byName.get_customer.handler({ search: 'acme' }, ctx)
    expect(ambiguous.result).toMatch(/Multiple customers match/)
  })
})

describe('update_customer', () => {
  test('updates only passed fields and resolves group', async () => {
    customerSvc.list.mockResolvedValue({ customers: [{ id: 'c1', name: 'Acme', code: 'CUS-1' }] })
    groupSvc.listAll.mockResolvedValue([{ id: 'g2', name: 'Wholesale' }])
    customerSvc.update.mockResolvedValue({ id: 'c1', name: 'Acme', code: 'CUS-1' })

    const { result } = await byName.update_customer.handler(
      { search: 'CUS-1', phone: '555', group: 'Wholesale' }, ctx,
    )
    expect(customerSvc.update).toHaveBeenCalledWith(
      'c1', { phone: '555', customerGroupId: 'g2' }, 'u1', 'o1',
    )
    expect(result.updated).toEqual(expect.arrayContaining(['phone', 'customerGroupId']))
  })

  test('no fields → does not call update', async () => {
    customerSvc.list.mockResolvedValue({ customers: [{ id: 'c1', name: 'Acme' }] })
    const { result } = await byName.update_customer.handler({ search: 'Acme' }, ctx)
    expect(customerSvc.update).not.toHaveBeenCalled()
    expect(result).toMatch(/Nothing to update/)
  })
})

describe('delete_customer', () => {
  test('removes a uniquely-resolved customer', async () => {
    customerSvc.list.mockResolvedValue({ customers: [{ id: 'c1', name: 'Acme', code: 'CUS-1' }] })
    customerSvc.remove.mockResolvedValue()
    const { result, action } = await byName.delete_customer.handler({ search: 'Acme' }, ctx)
    expect(customerSvc.remove).toHaveBeenCalledWith('c1', 'o1')
    expect(result).toMatch(/Deleted customer Acme \(CUS-1\)/)
    expect(action.path).toBe('/erp/customers')
  })

  test('does not delete when ambiguous', async () => {
    customerSvc.list.mockResolvedValue({ customers: [
      { id: 'c1', name: 'Acme One' }, { id: 'c2', name: 'Acme Two' },
    ] })
    const { result } = await byName.delete_customer.handler({ search: 'acme' }, ctx)
    expect(customerSvc.remove).not.toHaveBeenCalled()
    expect(result).toMatch(/Multiple customers match/)
  })
})

describe('customer groups', () => {
  test('create_customer_group auto-codes', async () => {
    groupSvc.create.mockResolvedValue({ id: 'g1', name: 'VIP', code: 'CGP-1' })
    const { result, action } = await byName.create_customer_group.handler({ name: 'VIP' }, ctx)
    expect(groupSvc.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'VIP', autoCode: true }))
    expect(result).toMatchObject({ code: 'CGP-1' })
    expect(action.path).toBe('/erp/customer-groups/g1/edit')
  })

  test('list_customer_groups returns slim rows', async () => {
    groupSvc.list.mockResolvedValue({ total: 1, groups: [{ id: 'g1', name: 'VIP', code: 'CGP-1', status: 'active' }] })
    const { result, action } = await byName.list_customer_groups.handler({}, ctx)
    expect(result.groups[0]).toMatchObject({ name: 'VIP', code: 'CGP-1' })
    expect(action.path).toBe('/erp/customer-groups')
  })
})
