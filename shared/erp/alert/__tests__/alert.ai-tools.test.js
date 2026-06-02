// Unit tests for the Alert AI tool handlers. The handlers lazily `require` the
// alert service, so we mock that module path and drive each tool's handler
// directly with a fake user ctx.
jest.mock('../services/alert.service', () => ({
  listAll: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(), options: jest.fn(),
}))

const alertSvc = require('../services/alert.service')
const { tools, navTargets } = require('../ai-tools')

const USER = { id: 'u1', organizationId: 'o1' }
const ctx  = { user: USER }
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))

beforeEach(() => jest.clearAllMocks())

describe('alert ai-tools — registry', () => {
  test('exposes the full toolset and nav targets', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'create_alert', 'delete_alert', 'get_alert', 'list_alerts', 'update_alert',
    ])
    expect(navTargets).toHaveProperty('alerts_list')
    expect(navTargets).toHaveProperty('alert_create')
  })

  test('every tool is server-kind with a handler and object params', () => {
    for (const t of tools) {
      expect(t.kind).toBe('server')
      expect(typeof t.handler).toBe('function')
      expect(t.parameters.type).toBe('object')
    }
  })
})

describe('create_alert', () => {
  test('creates a global alert with defaults', async () => {
    alertSvc.create.mockResolvedValue({ id: 'a1', title: 'Maintenance', scope: 'global', severity: 'info' })
    const { result, action } = await byName.create_alert.handler({ title: 'Maintenance' }, ctx)

    expect(alertSvc.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Maintenance', scope: 'global', severity: 'info', userId: 'u1', organizationId: 'o1',
    }))
    expect(result).toMatchObject({ id: 'a1', scope: 'global' })
    expect(action).toMatchObject({ type: 'navigate', path: '/erp/alerts/a1/edit' })
  })

  test('module scope resolves a module name to its slug', async () => {
    alertSvc.options.mockResolvedValue({ modules: [{ slug: 'erp', name: 'ERP' }, { slug: 'hrms', name: 'HRMS' }], departments: [] })
    alertSvc.create.mockResolvedValue({ id: 'a2', title: 'ERP notice', scope: 'module', severity: 'warning' })

    await byName.create_alert.handler({ title: 'ERP notice', scope: 'module', module: 'erp', severity: 'warning' }, ctx)
    expect(alertSvc.create).toHaveBeenCalledWith(expect.objectContaining({ scope: 'module', moduleSlug: 'erp', severity: 'warning' }))
  })

  test('department scope resolves a department name to its id', async () => {
    alertSvc.options.mockResolvedValue({ modules: [], departments: [{ id: 'd1', name: 'Sales' }] })
    alertSvc.create.mockResolvedValue({ id: 'a3', title: 'Sales meeting', scope: 'department', severity: 'info' })

    await byName.create_alert.handler({ title: 'Sales meeting', scope: 'department', department: 'sales' }, ctx)
    expect(alertSvc.create).toHaveBeenCalledWith(expect.objectContaining({ scope: 'department', departmentId: 'd1' }))
  })

  test('unknown module name reports an error and does not create', async () => {
    alertSvc.options.mockResolvedValue({ modules: [{ slug: 'erp', name: 'ERP' }], departments: [] })
    const { result } = await byName.create_alert.handler({ title: 'x', scope: 'module', module: 'nope' }, ctx)
    expect(result).toMatch(/No module matches/)
    expect(alertSvc.create).not.toHaveBeenCalled()
  })
})

describe('list_alerts', () => {
  test('passes filters, clamps the limit, returns slim rows', async () => {
    alertSvc.listAll.mockResolvedValue({ total: 1, alerts: [
      { id: 'a1', title: 'Hi', severity: 'info', scope: 'global', moduleSlug: null, departmentName: null, source: 'manual' },
    ] })
    const { result, action } = await byName.list_alerts.handler({ search: 'hi', scope: 'global', limit: 999 }, ctx)

    expect(alertSvc.listAll).toHaveBeenCalledWith(expect.objectContaining({
      search: 'hi', scope: 'global', limit: 50, organizationId: 'o1',
    }))
    expect(result.total).toBe(1)
    expect(result.alerts[0]).toMatchObject({ title: 'Hi', scope: 'global' })
    expect(action.path).toBe('/erp/alerts')
  })
})

describe('get_alert — resolution', () => {
  test('returns full detail on a unique match', async () => {
    alertSvc.listAll.mockResolvedValue({ alerts: [{ id: 'a1', title: 'Outage', body: 'details', severity: 'critical', scope: 'global' }] })
    const { result, action } = await byName.get_alert.handler({ search: 'Outage' }, ctx)
    expect(result).toMatchObject({ id: 'a1', body: 'details' })
    expect(action.path).toBe('/erp/alerts/a1/edit')
  })

  test('reports when nothing matches', async () => {
    alertSvc.listAll.mockResolvedValue({ alerts: [] })
    const { result, action } = await byName.get_alert.handler({ search: 'ghost' }, ctx)
    expect(result).toMatch(/No alert matches/)
    expect(action).toBeUndefined()
  })

  test('disambiguates by exact title, else asks to narrow', async () => {
    alertSvc.listAll.mockResolvedValue({ alerts: [
      { id: 'a1', title: 'Outage' }, { id: 'a2', title: 'Outage planned' },
    ] })
    const exact = await byName.get_alert.handler({ search: 'outage' }, ctx)
    expect(exact.result).toMatchObject({ id: 'a1' })

    alertSvc.listAll.mockResolvedValue({ alerts: [
      { id: 'a1', title: 'Outage one' }, { id: 'a2', title: 'Outage two' },
    ] })
    const ambiguous = await byName.get_alert.handler({ search: 'outage' }, ctx)
    expect(ambiguous.result).toMatch(/Multiple alerts match/)
  })
})

describe('update_alert', () => {
  test('updates only passed fields', async () => {
    alertSvc.listAll.mockResolvedValue({ alerts: [{ id: 'a1', title: 'Outage', scope: 'global' }] })
    alertSvc.update.mockResolvedValue({ id: 'a1', title: 'Outage', scope: 'global' })

    const { result } = await byName.update_alert.handler({ search: 'Outage', severity: 'warning' }, ctx)
    expect(alertSvc.update).toHaveBeenCalledWith('a1', { severity: 'warning' }, 'u1', 'o1')
    expect(result.updated).toEqual(['severity'])
  })

  test('changing scope to module resolves the new target', async () => {
    alertSvc.listAll.mockResolvedValue({ alerts: [{ id: 'a1', title: 'Outage', scope: 'global' }] })
    alertSvc.options.mockResolvedValue({ modules: [{ slug: 'hrms', name: 'HRMS' }], departments: [] })
    alertSvc.update.mockResolvedValue({ id: 'a1', title: 'Outage', scope: 'module' })

    await byName.update_alert.handler({ search: 'Outage', scope: 'module', module: 'hrms' }, ctx)
    expect(alertSvc.update).toHaveBeenCalledWith('a1', expect.objectContaining({ scope: 'module', moduleSlug: 'hrms' }), 'u1', 'o1')
  })

  test('no fields → does not call update', async () => {
    alertSvc.listAll.mockResolvedValue({ alerts: [{ id: 'a1', title: 'Outage', scope: 'global' }] })
    const { result } = await byName.update_alert.handler({ search: 'Outage' }, ctx)
    expect(alertSvc.update).not.toHaveBeenCalled()
    expect(result).toMatch(/Nothing to update/)
  })
})

describe('delete_alert', () => {
  test('removes a uniquely-resolved alert', async () => {
    alertSvc.listAll.mockResolvedValue({ alerts: [{ id: 'a1', title: 'Outage' }] })
    alertSvc.remove.mockResolvedValue()
    const { result, action } = await byName.delete_alert.handler({ search: 'Outage' }, ctx)
    expect(alertSvc.remove).toHaveBeenCalledWith('a1', 'o1')
    expect(result).toMatch(/Deleted alert "Outage"/)
    expect(action.path).toBe('/erp/alerts')
  })

  test('does not delete when ambiguous', async () => {
    alertSvc.listAll.mockResolvedValue({ alerts: [{ id: 'a1', title: 'Outage one' }, { id: 'a2', title: 'Outage two' }] })
    const { result } = await byName.delete_alert.handler({ search: 'outage' }, ctx)
    expect(alertSvc.remove).not.toHaveBeenCalled()
    expect(result).toMatch(/Multiple alerts match/)
  })
})
