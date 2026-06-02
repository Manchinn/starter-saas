// Legacy data fix: the old `users.*` permission slugs were renamed to
// `organizations.*`. Fresh installs seed `organizations.*` directly, so this
// only touches databases that still carry the old slugs. Each rename is
// guarded so it never collides with an already-present target slug.
// (Formerly scripts/migrate_user_to_org_perms.js.)
const RENAMES = [
  { from: 'users.list',   to: 'organizations.list',   name: 'List Organizations',   group: 'organizations' },
  { from: 'users.edit',   to: 'organizations.edit',   name: 'Edit Organizations',   group: 'organizations' },
  { from: 'users.delete', to: 'organizations.delete', name: 'Delete Organizations', group: 'organizations' },
]

async function rename(ctx, from, to, name, group) {
  await ctx.rawSafe(
    `UPDATE "Permissions" SET slug = ?, name = ?, "group" = ?
       WHERE slug = ? AND NOT EXISTS (SELECT 1 FROM "Permissions" WHERE slug = ?)`,
    { replacements: [to, name, group, from, to] }
  )
}

module.exports = {
  async up(ctx) {
    for (const r of RENAMES) await rename(ctx, r.from, r.to, r.name, r.group)
  },
  async down(ctx) {
    for (const r of RENAMES) await rename(ctx, r.to, r.from, r.from, 'users')
  },
}
