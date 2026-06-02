// HRMS was promoted from an ERP submodule to its own shared module, so its
// permission slugs move out of the `erp.*` namespace into `hrms.*`. Fresh
// installs seed the new slugs directly (declared in hrms.module.js), so this
// only touches databases that still carry the old `erp.hrms.*` /
// `erp.departments.*` rows. Role grants reference permissions by id, so the
// rename preserves existing assignments. Each rename is guarded so it never
// collides with an already-present target slug.
const RENAMES = [
  { from: 'erp.hrms.list',          to: 'hrms.employees.list',    name: 'List Employees',     group: 'hrms' },
  { from: 'erp.hrms.edit',          to: 'hrms.employees.edit',    name: 'Edit Employees',     group: 'hrms' },
  { from: 'erp.hrms.delete',        to: 'hrms.employees.delete',  name: 'Delete Employees',   group: 'hrms' },
  { from: 'erp.departments.list',   to: 'hrms.departments.list',  name: 'List Departments',   group: 'hrms' },
  { from: 'erp.departments.edit',   to: 'hrms.departments.edit',  name: 'Edit Departments',   group: 'hrms' },
  { from: 'erp.departments.delete', to: 'hrms.departments.delete', name: 'Delete Departments', group: 'hrms' },
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
    for (const r of RENAMES) await rename(ctx, r.to, r.from, r.from, 'erp')
  },
}
