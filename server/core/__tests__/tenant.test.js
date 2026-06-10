// Security tests for core/tenant — the multi-tenant scoping primitives.
//
// findByPkScoped / assertSameOrg are THE cross-tenant IDOR defence: every ERP
// read-one / update / delete and every client-supplied FK reference funnels
// through them. A regression here is an org-isolation breach across the whole
// product, so this suite pins the contract precisely — including the deliberate
// "orgId == null means internal/trusted, unscoped" escape hatch that callers
// rely on for seeders and tests.

const { orgIdOf, findByPkScoped, assertSameOrg } = require('../tenant')

const makeModel = () => ({
  findByPk: jest.fn().mockResolvedValue('unscoped-row'),
  findOne:  jest.fn().mockResolvedValue('scoped-row'),
})

describe('tenant.orgIdOf', () => {
  test('staff user → their owning organizationId', () => {
    expect(orgIdOf({ user: { id: 'u1', organizationId: 'org-9' } })).toBe('org-9')
  })

  test('top-level org user → their own id (the user IS the org)', () => {
    expect(orgIdOf({ user: { id: 'org-1' } })).toBe('org-1')
  })

  test('no user / no request → null (never undefined, never a guessable default)', () => {
    expect(orgIdOf({})).toBeNull()
    expect(orgIdOf(undefined)).toBeNull()
  })
})

describe('tenant.findByPkScoped — the IDOR boundary', () => {
  test('scopes the lookup to both id AND organizationId', async () => {
    const Model = makeModel()
    await findByPkScoped(Model, 'row-1', 'org-1')
    expect(Model.findOne).toHaveBeenCalledWith({ where: { id: 'row-1', organizationId: 'org-1' } })
    expect(Model.findByPk).not.toHaveBeenCalled() // never falls back to an unscoped read
  })

  test('a caller-supplied where cannot override the org scope', async () => {
    // Even if request-derived options smuggle organizationId into options.where,
    // the tenant scope wins — the spread order puts the scope last.
    const Model = makeModel()
    await findByPkScoped(Model, 'row-1', 'org-1', { where: { organizationId: 'victim-org', status: 'active' } })
    expect(Model.findOne).toHaveBeenCalledWith({
      where: { status: 'active', id: 'row-1', organizationId: 'org-1' },
    })
  })

  test('passes find options (include/attributes/transaction) through untouched', async () => {
    const Model = makeModel()
    const include = [{ as: 'items' }]
    await findByPkScoped(Model, 'row-1', 'org-1', { include, transaction: 'tx' })
    expect(Model.findOne).toHaveBeenCalledWith(expect.objectContaining({ include, transaction: 'tx' }))
  })

  test('null/undefined id short-circuits to null without querying', async () => {
    const Model = makeModel()
    await expect(findByPkScoped(Model, null, 'org-1')).resolves.toBeNull()
    await expect(findByPkScoped(Model, undefined, 'org-1')).resolves.toBeNull()
    expect(Model.findOne).not.toHaveBeenCalled()
    expect(Model.findByPk).not.toHaveBeenCalled()
  })

  test('orgId == null is the documented internal/trusted path: unscoped findByPk', async () => {
    // HTTP controllers must always pass a real orgId; this branch exists for
    // seeders/migrations/unit tests. Pinned so a change to this contract is a
    // conscious decision, not an accident.
    const Model = makeModel()
    await expect(findByPkScoped(Model, 'row-1', null, { include: 'x' })).resolves.toBe('unscoped-row')
    expect(Model.findByPk).toHaveBeenCalledWith('row-1', { include: 'x' })
    expect(Model.findOne).not.toHaveBeenCalled()
  })

  test('returns null (caller 404s) when the row exists under another org', async () => {
    const Model = makeModel()
    Model.findOne.mockResolvedValue(null) // scope filter excluded the foreign row
    await expect(findByPkScoped(Model, 'foreign-row', 'org-1')).resolves.toBeNull()
  })
})

describe('tenant.assertSameOrg — client-supplied FK guard', () => {
  test('missing record → 404 with the label (existence not implied)', () => {
    expect(() => assertSameOrg(null, 'org-1', 'Customer'))
      .toThrow(expect.objectContaining({ status: 404, message: 'Customer not found' }))
  })

  test('org mismatch → 400, refusing a foreign org\'s record as a reference', () => {
    expect(() => assertSameOrg({ organizationId: 'other-org' }, 'org-1', 'Customer'))
      .toThrow(expect.objectContaining({ status: 400, message: 'Customer does not belong to your organization' }))
  })

  test('returns the record when the org matches', () => {
    const rec = { organizationId: 'org-1' }
    expect(assertSameOrg(rec, 'org-1')).toBe(rec)
  })

  test('compares org ids as strings (numeric vs string parity)', () => {
    expect(assertSameOrg({ organizationId: 7 }, '7')).toBeTruthy()
    expect(() => assertSameOrg({ organizationId: 7 }, '8')).toThrow(expect.objectContaining({ status: 400 }))
  })

  test('a record with organizationId=null does NOT match a real org (no null-row leakage)', () => {
    expect(() => assertSameOrg({ organizationId: null }, 'org-1'))
      .toThrow(expect.objectContaining({ status: 400 }))
  })
})
