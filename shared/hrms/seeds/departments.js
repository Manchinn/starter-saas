// Demo departments.
const DEPARTMENTS = [
  { code: 'IT',   name: 'Information Technology', description: 'IT infrastructure and software' },
  { code: 'HR',   name: 'Human Resources',        description: 'Recruitment and HR operations' },
  { code: 'FIN',  name: 'Finance',                description: 'Finance and accounting' },
  { code: 'SALE', name: 'Sales',                  description: 'Sales and business development' },
  { code: 'WH',   name: 'Warehouse',              description: 'Warehouse and logistics' },
]

module.exports = {
  name: 'departments',
  tier: 'demo',
  order: 200,
  async run(ctx) {
    const { Department } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const rows = []
    for (const d of DEPARTMENTS) {
      const [dept] = await Department.findOrCreate({
        where: { code: d.code, organizationId },
        defaults: { ...d, isActive: true, organizationId, createdBy },
      })
      rows.push(dept)
    }
    ctx.set('departments', rows)
  },
}
