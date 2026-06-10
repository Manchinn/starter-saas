// Tests for the team gate: owner accounts pass implicitly, staff need
// `team.manage` (or the admin wildcard), everyone else is 403.

jest.mock('../../../middleware/permission', () => ({ resolvePermissions: jest.fn() }))

const { resolvePermissions } = require('../../../middleware/permission')
const { requireTeamManager } = require('../team.middleware')

const makeRes = () => {
  const r = {}
  r.status = jest.fn(() => r)
  r.json   = jest.fn(() => r)
  return r
}

beforeEach(() => jest.clearAllMocks())

test('401 when unauthenticated', async () => {
  const res = makeRes(); const next = jest.fn()
  await requireTeamManager({}, res, next)
  expect(res.status).toHaveBeenCalledWith(401)
  expect(next).not.toHaveBeenCalled()
})

test('owner account (no organizationId) passes without a permission lookup', async () => {
  const res = makeRes(); const next = jest.fn()
  await requireTeamManager({ user: { id: 'o1', organizationId: null } }, res, next)
  expect(next).toHaveBeenCalled()
  expect(resolvePermissions).not.toHaveBeenCalled()
})

test('staff with team.manage passes', async () => {
  resolvePermissions.mockResolvedValue(new Set(['team.manage']))
  const res = makeRes(); const next = jest.fn()
  await requireTeamManager({ user: { id: 's1', organizationId: 'o1' } }, res, next)
  expect(next).toHaveBeenCalled()
})

test('staff with the admin wildcard passes', async () => {
  resolvePermissions.mockResolvedValue(new Set(['*']))
  const res = makeRes(); const next = jest.fn()
  await requireTeamManager({ user: { id: 's1', organizationId: 'o1' } }, res, next)
  expect(next).toHaveBeenCalled()
})

test('staff without the permission is refused 403', async () => {
  resolvePermissions.mockResolvedValue(new Set(['erp.customers.list']))
  const res = makeRes(); const next = jest.fn()
  await requireTeamManager({ user: { id: 's1', organizationId: 'o1' } }, res, next)
  expect(res.status).toHaveBeenCalledWith(403)
  expect(next).not.toHaveBeenCalled()
})

test('500 when the permission lookup throws', async () => {
  resolvePermissions.mockRejectedValue(new Error('db down'))
  const res = makeRes(); const next = jest.fn()
  await requireTeamManager({ user: { id: 's1', organizationId: 'o1' } }, res, next)
  expect(res.status).toHaveBeenCalledWith(500)
})
