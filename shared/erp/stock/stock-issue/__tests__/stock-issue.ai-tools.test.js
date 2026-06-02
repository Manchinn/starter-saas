// Unit tests for the Stock Issue AI tool handlers (read-only lookups). The
// handlers lazily `require` the stock-issue service, so we mock that module
// path and drive each tool's handler directly with a fake user ctx.
jest.mock('../stock-issue.service', () => ({
  list: jest.fn(), getById: jest.fn(),
}))

const issueSvc = require('../stock-issue.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('stock-issue ai-tools — registry', () => {
  test('exposes the read-only toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_stock_issue', 'list_stock_issues'])
    expect(navTargets).toHaveProperty('stock_issues_list')
    expect(navTargets).toHaveProperty('stock_issues_create')
  })

  test('every tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })

  test('exposes no write/workflow tools', () => {
    const names = Object.keys(byName).join(' ')
    expect(names).not.toMatch(/create|update|delete|confirm/)
  })
})

describe('list_stock_issues', () => {
  test('passes filters, clamps the limit, slims rows', async () => {
    issueSvc.list.mockResolvedValue({ total: 1, issues: [
      { id: 'i1', refNo: 'ISS-1', date: '2026-01-01', status: 'confirmed', reason: 'damage', store: { name: 'Main' } },
    ] })
    const { result, action } = await byName.list_stock_issues.handler({ search: 'iss', limit: 999 }, ctx)
    expect(issueSvc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'iss', limit: 50, organizationId: 'o1' }))
    expect(result.issues[0]).toMatchObject({ refNo: 'ISS-1', reason: 'damage', store: 'Main' })
    expect(action.path).toBe('/erp/stock-issue')
  })
})

describe('get_stock_issue', () => {
  test('resolves by ref then returns header + items', async () => {
    issueSvc.list.mockResolvedValue({ issues: [{ id: 'i1', refNo: 'ISS-1' }] })
    issueSvc.getById.mockResolvedValue({
      id: 'i1', refNo: 'ISS-1', status: 'confirmed', reason: 'damage', store: { name: 'Main' },
      items: [{ product: { name: 'Widget' }, qty: 4, notes: 'broken' }],
    })
    const { result, action } = await byName.get_stock_issue.handler({ search: 'ISS-1' }, ctx)
    expect(issueSvc.getById).toHaveBeenCalledWith('i1')
    expect(result.items[0]).toMatchObject({ product: 'Widget', qty: 4, notes: 'broken' })
    expect(action.path).toBe('/erp/stock-issue/i1')
  })

  test('reports when nothing matches', async () => {
    issueSvc.list.mockResolvedValue({ issues: [] })
    const { result } = await byName.get_stock_issue.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No stock issue matches/)
    expect(issueSvc.getById).not.toHaveBeenCalled()
  })

  test('asks to narrow on ambiguous ref', async () => {
    issueSvc.list.mockResolvedValue({ issues: [{ id: 'i1', refNo: 'ISS-10' }, { id: 'i2', refNo: 'ISS-100' }] })
    const { result } = await byName.get_stock_issue.handler({ search: 'ISS-1' }, ctx)
    expect(result).toMatch(/Multiple stock issues match/)
  })
})
