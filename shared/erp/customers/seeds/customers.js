// Demo customers. `group` indexes the customer-groups array (160):
// 0=Retail, 1=Wholesale, 2=VIP, 3=Government.
const CUSTOMERS = [
  { code: 'CUS-001', name: 'Bright Future Co., Ltd.', company: 'Bright Future Co., Ltd.', email: 'purchase@brightfuture.th',     phone: '02-111-2001', group: 1, createdAt: '2024-06-10', modifiedAt: '2025-01-15' },
  { code: 'CUS-002', name: 'Sunrise Trading',         company: 'Sunrise Trading',         email: 'order@sunrisetrading.th',      phone: '02-111-2002', group: 1, createdAt: '2024-07-03', modifiedAt: '2025-02-20' },
  { code: 'CUS-003', name: 'Metro Hospital',          company: 'Metro Hospital',          email: 'procurement@metrohospital.th', phone: '02-111-2003', group: 3, createdAt: '2024-08-21', modifiedAt: '2025-03-05' },
  { code: 'CUS-004', name: 'Somchai Rattana',         company: '',                        email: 'somchai.r@gmail.com',          phone: '089-111-0004', group: 0, createdAt: '2024-09-14', modifiedAt: '2024-09-14' },
  { code: 'CUS-005', name: 'Nipa Enterprises',        company: 'Nipa Enterprises',        email: 'nipa@nipaent.th',              phone: '02-222-0005', group: 2, createdAt: '2024-10-01', modifiedAt: '2025-04-11' },
  { code: 'CUS-006', name: 'Bangkok City School',     company: 'Bangkok City School',     email: 'admin@bangkokcityschool.th',   phone: '02-333-0006', group: 3, createdAt: '2024-11-08', modifiedAt: '2025-01-30' },
  { code: 'CUS-007', name: 'Malee Supansa',           company: '',                        email: 'malee.s@hotmail.com',          phone: '081-444-0007', group: 0, createdAt: '2024-12-05', modifiedAt: '2024-12-05' },
  { code: 'CUS-008', name: 'Global Tech Solutions',   company: 'Global Tech Solutions',   email: 'buy@globaltech.th',            phone: '02-555-0008', group: 2, createdAt: '2025-01-22', modifiedAt: '2025-05-10' },
]

module.exports = {
  name: 'customers',
  tier: 'demo',
  order: 170,
  async run(ctx) {
    const { Customer } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const groups = ctx.get('customerGroups')
    const rows = []
    for (const c of CUSTOMERS) {
      const { group, ...data } = c
      const [customer] = await Customer.findOrCreate({
        where: { code: c.code, organizationId },
        defaults: { ...data, status: 'active', customerGroupId: groups[group].id, organizationId, createdBy },
      })
      rows.push(customer)
    }
    ctx.set('customers', rows)
  },
}
