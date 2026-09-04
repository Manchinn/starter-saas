// Demo staff layer: one login account per Employee, grouped into job-function
// roles with realistic permission grants. Runs after employees (210) so the
// Employee rows exist, and after roles (20) / permissions (10) for ctx refs.
//
// Idempotent: users are findOrCreate by email (password only on create),
// org/defaultPage fields fill only when empty, and role assignment is re-applied
// every run as the seed's source of truth — mirroring the roles seed.

const DEMO_PASSWORD = 'User1234!'
const DEFAULT_PAGE  = '/dashboard'

// Job-function roles beyond the platform defaults (super-admin/manager/viewer/
// customer come from the roles seed). Sentinel '*' resolves against the live
// permission catalog exactly like the roles seed.
const STAFF_ROLES = [
  {
    slug: 'hr-specialist', name: 'HR Specialist', color: '#be185d',
    description: 'HR staff — employees, departments, HR roles',
    permissionSlugs: [
      'dashboard.view',
      'hrms.employees.list', 'hrms.employees.edit',
      'hrms.departments.list', 'hrms.departments.edit',
      'hrms.roles.list',
    ],
  },
  {
    slug: 'accountant', name: 'Accountant', color: '#0d9488',
    description: 'Finance staff — invoices, receipts, bills, accounting, tax',
    permissionSlugs: [
      'dashboard.view',
      'erp.invoices.list', 'erp.invoices.edit', 'erp.invoices.delete',
      'erp.receipts.list', 'erp.receipts.edit', 'erp.receipts.delete',
      'erp.bills.list', 'erp.bills.edit', 'erp.bills.approve',
      'erp.accounting.list', 'erp.accounting.edit',
      'erp.tax-periods.list', 'erp.tax-periods.edit',
      'erp.currencies.list', 'erp.currencies.edit',
    ],
  },
  {
    slug: 'sales', name: 'Sales', color: '#ea580c',
    description: 'Sales staff — customers, quotations, orders, receipts',
    permissionSlugs: [
      'dashboard.view',
      'erp.customers.list', 'erp.customers.edit',
      'erp.customer-groups.list',
      'erp.quotations.list', 'erp.quotations.edit',
      'erp.orders.list', 'erp.orders.edit',
      'erp.receipts.list', 'erp.receipts.edit',
      'erp.sale-items.list',
    ],
  },
  {
    slug: 'sales-manager', name: 'Sales Manager', color: '#c2410c',
    description: 'Sales leadership — sales set plus pricing, invoices, deletes',
    permissionSlugs: [
      'dashboard.view',
      'erp.customers.list', 'erp.customers.edit', 'erp.customers.delete',
      'erp.customer-groups.list', 'erp.customer-groups.edit',
      'erp.quotations.list', 'erp.quotations.edit',
      'erp.orders.list', 'erp.orders.edit',
      'erp.receipts.list', 'erp.receipts.edit',
      'erp.invoices.list', 'erp.invoices.edit',
      'erp.pricing.list', 'erp.pricing.manage',
      'erp.sale-items.list', 'erp.sale-items.manage',
    ],
  },
  {
    slug: 'warehouse', name: 'Warehouse', color: '#b45309',
    description: 'Warehouse staff — products, stock, stores, UoM',
    permissionSlugs: [
      'dashboard.view',
      'erp.products.list', 'erp.products.edit',
      'erp.stock.list', 'erp.stock.edit',
      'erp.stores.list', 'erp.stores.edit',
      'erp.uom.list',
      'erp.alerts.list',
    ],
  },
  {
    slug: 'it-developer', name: 'IT Developer', color: '#4f46e5',
    description: 'IT staff — settings, modules, alerts, audit',
    permissionSlugs: [
      'dashboard.view',
      'erp.settings.view', 'erp.settings.manage',
      'modules.list', 'modules.manage',
      'erp.alerts.list', 'erp.alerts.manage',
      'erp.audit.list',
    ],
  },
]

// employeeCode → { email, roleSlug, departmentCode }. The full name comes from
// the Employee record; email local-part = firstname.lastname@maekade.co.th.
const STAFF = [
  { code: 'EMP-001', email: 'somchai.kittipong@maekade.co.th', roleSlug: 'manager',      dept: 'IT' },
  { code: 'EMP-002', email: 'nipa.sriwan@maekade.co.th',       roleSlug: 'hr-specialist', dept: 'HR' },
  { code: 'EMP-003', email: 'wanchai.thongsuk@maekade.co.th',  roleSlug: 'accountant',    dept: 'FIN' },
  { code: 'EMP-004', email: 'malee.phongphan@maekade.co.th',   roleSlug: 'sales',         dept: 'SALE' },
  { code: 'EMP-005', email: 'prawit.suksai@maekade.co.th',     roleSlug: 'warehouse',     dept: 'WH' },
  { code: 'EMP-006', email: 'supawit.nakorn@maekade.co.th',    roleSlug: 'sales-manager', dept: 'SALE' },
  { code: 'EMP-007', email: 'kannika.buranee@maekade.co.th',   roleSlug: 'accountant',    dept: 'FIN' },
  { code: 'EMP-008', email: 'arthit.wongkham@maekade.co.th',   roleSlug: 'it-developer',  dept: 'IT' },
]

function isEmpty(v) { return v === null || v === undefined || String(v).trim() === '' }

module.exports = {
  name: 'org-staff',
  tier: 'demo',
  order: 220,
  async run(ctx) {
    const { User, Role, Employee } = ctx.models
    const permissions = ctx.get('permissions') || {}
    const platformRoles = ctx.get('roles') || {}
    const organizationId = ctx.get('orgId')
    if (!organizationId) throw new Error('org-staff seed requires ctx orgId (run users seed first)')

    // 1. Job-function roles: findOrCreate + (re)apply permission grants.
    const rolesBySlug = { ...platformRoles }
    for (const def of STAFF_ROLES) {
      const { permissionSlugs, ...roleData } = def
      const [role] = await Role.findOrCreate({ where: { slug: def.slug }, defaults: roleData })
      const slugs = permissionSlugs === '*' ? Object.keys(permissions) : permissionSlugs
      await role.setPermissions(slugs.map((s) => permissions[s]).filter(Boolean))
      rolesBySlug[def.slug] = role
    }

    // 2. One login account per employee + link Employee.userId.
    for (const s of STAFF) {
      const [user] = await User.findOrCreate({
        where: { email: s.email },
        defaults: {
          name: s.email.split('@')[0], // placeholder; replaced below on first run
          password: DEMO_PASSWORD,
          role: 'user',
          organizationId,
          defaultPage: DEFAULT_PAGE,
        },
      })
      if (isEmpty(user.organizationId)) { user.organizationId = organizationId; await user.save() }
      if (isEmpty(user.defaultPage))    { user.defaultPage = DEFAULT_PAGE;        await user.save() }

      const role = rolesBySlug[s.roleSlug]
      if (!role) throw new Error(`org-staff: role "${s.roleSlug}" not found for ${s.email}`)
      await user.setRoles([role])

      const employee = await Employee.findOne({ where: { employeeCode: s.code, organizationId } })
      if (!employee) throw new Error(`org-staff: employee ${s.code} not found — run employees seed first`)
      if (employee.department !== s.dept) { employee.department = s.dept; await employee.save() }
      if (employee.userId !== user.id)    { employee.userId = user.id;    await employee.save() }
      if (user.name === s.email.split('@')[0] && user.name !== `${employee.firstName} ${employee.lastName}`) {
        // Replace only the seed's own placeholder — a customised name survives.
        user.name = `${employee.firstName} ${employee.lastName}`
        await user.save()
      }
    }
  },
}
