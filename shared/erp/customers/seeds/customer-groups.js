// Demo customer groups. Ordered array: [Retail, Wholesale, VIP, Government].
const GROUPS = [
  { name: 'Retail',     description: 'Walk-in retail customers' },
  { name: 'Wholesale',  description: 'Bulk purchase accounts' },
  { name: 'VIP',        description: 'High-value accounts' },
  { name: 'Government', description: 'Government agencies' },
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
