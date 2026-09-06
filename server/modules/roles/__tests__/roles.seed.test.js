// Unit tests for the roles seed — the default permission grants.
//
// The Viewer role must NOT carry `organizations.list`: the organizations
// endpoints return cross-tenant account data (every top-level org's profile —
// email, phone, taxId, provider uid), so a freshly registered account holding
// that permission becomes a platform-wide PII harvester (issue #11). These
// tests pin the grant sets so a future "just add it back" edit fails loudly.

jest.mock('../../../core/module.loader', () => ({
  sharedModulePermissionSlugs: () => ['customers.view', 'products.view'],
}))

const seed = require('../seeds/roles')

const makeRole = (slug) => ({
  slug,
  setPermissions: jest.fn().mockResolvedValue(),
  setModules: jest.fn().mockResolvedValue(),
})

const buildCtx = () => {
  const roles = {}
  const bySlug = {}
  const ctx = {
    models: {
      Role: {
        findOrCreate: jest.fn(async ({ where: { slug }, defaults }) => {
          if (!bySlug[slug]) bySlug[slug] = { ...makeRole(slug), ...defaults }
          return [bySlug[slug], !roles[slug]]
        }),
      },
      Module: { findAll: jest.fn().mockResolvedValue([{ id: 'm1' }]) },
    },
    _get: { permissions: {} },
    get(key) { return this._get[key] },
    set(key, value) { this._get[key] = value },
    bySlug,
  }
  // A permission catalog that includes both core and shared slugs, so the
  // '*' sentinel and the 'shared' sentinel resolve against real keys.
  for (const slug of ['dashboard.view', 'organizations.list', 'organizations.edit', 'modules.list', 'customers.view', 'products.view']) {
    ctx._get.permissions[slug] = { slug }
  }
  return ctx
}

// The seed passes permission objects (resolved from the catalog), not slugs.
const grantedSlugs = (role) => role.setPermissions.mock.calls[0][0].map((p) => p.slug)

describe('roles seed — default permission grants (issue #11)', () => {
  test('viewer is read-only WITHOUT organizations.list', async () => {
    const ctx = buildCtx()
    await seed.run(ctx)
    const slugs = grantedSlugs(ctx.bySlug['viewer'])
    expect(slugs).toContain('dashboard.view')
    expect(slugs).toContain('modules.list')
    expect(slugs).not.toContain('organizations.list')
  })

  test('manager keeps organizations.list (org-management plane)', async () => {
    const ctx = buildCtx()
    await seed.run(ctx)
    const slugs = grantedSlugs(ctx.bySlug['manager'])
    expect(slugs).toContain('organizations.list')
    expect(slugs).toContain('organizations.edit')
  })

  test('super-admin resolves the "*" sentinel to every seeded permission', async () => {
    const ctx = buildCtx()
    await seed.run(ctx)
    const slugs = grantedSlugs(ctx.bySlug['super-admin'])
    expect(slugs).toEqual(expect.arrayContaining(['dashboard.view', 'organizations.list', 'modules.list', 'customers.view', 'products.view']))
  })

  test('customer resolves the "shared" sentinel to dashboard + shared module permissions only', async () => {
    const ctx = buildCtx()
    await seed.run(ctx)
    const slugs = grantedSlugs(ctx.bySlug['customer'])
    expect(slugs).toEqual(expect.arrayContaining(['dashboard.view', 'customers.view', 'products.view']))
    expect(slugs).not.toContain('organizations.list')
  })
})
