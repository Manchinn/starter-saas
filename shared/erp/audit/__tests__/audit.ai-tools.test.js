// Unit tests for the Audit AI tool handlers. The handlers lazily `require` the
// audit service, so we mock that module path and drive each tool's handler
// directly with a fake user ctx.
jest.mock('../audit.service', () => ({
  list: jest.fn(), log: jest.fn(),
}))

const auditSvc = require('../audit.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('audit ai-tools — registry', () => {
  test('exposes the read-only toolset and nav target', () => {
    expect(Object.keys(byName).sort()).toEqual(['get_entity_history', 'list_audit_logs'])
    expect(navTargets).toHaveProperty('audit_log')
  })

  test('every tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })
})

describe('list_audit_logs', () => {
  test('passes filters, clamps the limit, returns slim rows', async () => {
    auditSvc.list.mockResolvedValue({ total: 1, logs: [
      { id: 'l1', action: 'invoice.send', entityType: 'Invoice', entityId: 'i1', userEmail: 'a@x.com', summary: { n: 1 }, createdAt: '2026-01-01' },
    ] })
    const { result, action } = await byName.list_audit_logs.handler(
      { action: 'send', entityType: 'Invoice', dateFrom: '2026-01-01', limit: 999 }, ctx,
    )

    expect(auditSvc.list).toHaveBeenCalledWith(expect.objectContaining({
      action: 'send', entityType: 'Invoice', dateFrom: '2026-01-01', limit: 50, organizationId: 'o1',
    }))
    expect(result.total).toBe(1)
    expect(result.logs[0]).toMatchObject({ action: 'invoice.send', entityType: 'Invoice', user: 'a@x.com' })
    expect(action.path).toBe('/erp/settings/audit-log')
  })

  test('defaults the limit to 10 when omitted', async () => {
    auditSvc.list.mockResolvedValue({ total: 0, logs: [] })
    await byName.list_audit_logs.handler({}, ctx)
    expect(auditSvc.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, organizationId: 'o1' }))
  })
})

describe('get_entity_history', () => {
  test('returns the trail for a specific record', async () => {
    auditSvc.list.mockResolvedValue({ total: 2, logs: [
      { id: 'l2', action: 'invoice.update', entityType: 'Invoice', entityId: 'i1', userEmail: 'a@x.com', createdAt: '2026-01-02' },
      { id: 'l1', action: 'invoice.create', entityType: 'Invoice', entityId: 'i1', userEmail: 'a@x.com', createdAt: '2026-01-01' },
    ] })
    const { result, action } = await byName.get_entity_history.handler({ entityType: 'Invoice', entityId: 'i1' }, ctx)

    expect(auditSvc.list).toHaveBeenCalledWith(expect.objectContaining({
      entityType: 'Invoice', entityId: 'i1', limit: 20, organizationId: 'o1',
    }))
    expect(result).toMatchObject({ entityType: 'Invoice', entityId: 'i1', total: 2 })
    expect(result.history).toHaveLength(2)
    expect(action.path).toBe('/erp/settings/audit-log')
  })

  test('reports when there is no history', async () => {
    auditSvc.list.mockResolvedValue({ total: 0, logs: [] })
    const { result, action } = await byName.get_entity_history.handler({ entityType: 'Invoice', entityId: 'ghost' }, ctx)
    expect(result).toMatch(/No audit history found/)
    expect(action).toBeUndefined()
  })

  test('requires both entityType and entityId', async () => {
    const { result } = await byName.get_entity_history.handler({ entityType: 'Invoice', entityId: '' }, ctx)
    expect(auditSvc.list).not.toHaveBeenCalled()
    expect(result).toMatch(/Provide both/)
  })
})
