// Demo customer groups. Ordered array mirrors the CG-00x codes.
const GROUPS = [
  { code: 'CG-001', name: 'Retail',     description: 'Walk-in retail customers' },
  { code: 'CG-002', name: 'Wholesale',  description: 'Bulk purchase accounts' },
  { code: 'CG-003', name: 'VIP',        description: 'High-value accounts with premium pricing' },
  { code: 'CG-004', name: 'Government', description: 'Government agencies and public institutions' },
]

module.exports = {
  name: 'customer-groups',
  tier: 'demo',
  order: 160,
  async run(ctx) {
    const { CustomerGroup } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const rows = []
    for (const g of GROUPS) {
      const [group] = await CustomerGroup.findOrCreate({
        where: { name: g.name, organizationId },
        defaults: { ...g, status: 'active', organizationId, createdBy },
      })
      rows.push(group)
    }
    ctx.set('customerGroups', rows)
  },
}
