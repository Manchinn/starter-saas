// Security tests for modules/organizations.controller — actor wiring and
// self-scoping.
//
// The service's privilege-escalation guards (admin-role grant, role assignment,
// plan change) only run when an `actor` is passed; a missing actor means
// "internal/trusted call" and SKIPS them. The HTTP controller is therefore the
// single point keeping those guards alive: these tests pin that create/update/
// assignRoles forward req.user as the actor, so a refactor that drops the
// argument fails loudly here instead of silently disabling authorization.
//
// They also pin self-scoping: the "my" endpoints and staff listing derive their
// subject from req.user, never from caller-controlled params/query.

jest.mock('../organization.service')

const organizationService = require('../organization.service')
const controller = require('../organization.controller')

const makeRes = () => {
  const r = { statusCode: null, body: null }
  r.status = jest.fn((c) => { r.statusCode = c; return r })
  r.json = jest.fn((b) => { r.body = b; return r })
  return r
}

const ACTOR = { id: 'actor-1', role: 'user', organizationId: null }

beforeEach(() => jest.clearAllMocks())

describe('actor wiring — the guard kill-switch', () => {
  test('create forwards req.user as the actor (guards stay armed)', async () => {
    organizationService.create.mockResolvedValue({ id: 'o1' })
    await controller.create({ body: { name: 'Acme' }, user: ACTOR }, makeRes())
    expect(organizationService.create).toHaveBeenCalledWith({ name: 'Acme' }, ACTOR)
    // Defence in depth: the actor must never be undefined on the HTTP path —
    // undefined would put the service into trusted/internal mode.
    expect(organizationService.create.mock.calls[0][1]).toBeDefined()
  })

  test('update forwards req.user as the actor', async () => {
    organizationService.update.mockResolvedValue({ id: 'o1' })
    await controller.update({ params: { id: 'o1' }, body: { role: 'admin' }, user: ACTOR }, makeRes())
    expect(organizationService.update).toHaveBeenCalledWith('o1', { role: 'admin' }, ACTOR)
    expect(organizationService.update.mock.calls[0][2]).toBeDefined()
  })

  test('assignRoles forwards req.user as the actor', async () => {
    organizationService.assignRoles.mockResolvedValue({ id: 'o1' })
    await controller.assignRoles({ params: { id: 'o1' }, body: { roleIds: ['r1'] }, user: ACTOR }, makeRes())
    expect(organizationService.assignRoles).toHaveBeenCalledWith('o1', ['r1'], ACTOR)
    expect(organizationService.assignRoles.mock.calls[0][2]).toBeDefined()
  })

  test('a guard rejection surfaces with its own status, not a generic 200/500', async () => {
    organizationService.create.mockRejectedValue({ status: 403, message: 'Only system administrators can grant the admin role.' })
    const res = makeRes()
    await controller.create({ body: { role: 'admin' }, user: ACTOR }, res)
    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual({ success: false, message: 'Only system administrators can grant the admin role.' })
  })
})

describe('self-scoping — subject comes from req.user, never the request', () => {
  test('myModules / myPermissions resolve for the authenticated user id', async () => {
    organizationService.getMyModules.mockResolvedValue([])
    organizationService.getUserPermissions.mockResolvedValue({ isAdmin: false, permissions: [] })

    await controller.myModules({ user: { id: 'u7' }, params: { id: 'someone-else' } }, makeRes())
    await controller.myPermissions({ user: { id: 'u7' }, query: { userId: 'someone-else' } }, makeRes())

    expect(organizationService.getMyModules).toHaveBeenCalledWith('u7')
    expect(organizationService.getUserPermissions).toHaveBeenCalledWith('u7')
  })

  test('listStaff scopes to the caller\'s own org — a query param cannot widen it', async () => {
    organizationService.getStaff.mockResolvedValue([])
    // A staff user (organizationId set) trying to read another org via query.
    await controller.listStaff(
      { user: { id: 'u1', organizationId: 'my-org' }, query: { organizationId: 'victim-org', search: '' } },
      makeRes(),
    )
    expect(organizationService.getStaff).toHaveBeenCalledWith('my-org', '')
  })

  test('listStaff for a top-level org user falls back to their own id as the org key', async () => {
    organizationService.getStaff.mockResolvedValue([])
    await controller.listStaff({ user: { id: 'org-1' }, query: {} }, makeRes())
    expect(organizationService.getStaff).toHaveBeenCalledWith('org-1', undefined)
  })
})
