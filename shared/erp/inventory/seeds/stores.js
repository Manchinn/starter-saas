// Demo warehouses / stores. Published as an ordered array for product links.
const STORES = [
  { name: 'Main Warehouse', code: 'WH-MAIN',  address: '123 Industrial Rd, Bangkok', phone: '02-111-0001' },
  { name: 'North Branch',   code: 'WH-NORTH', address: '45 Northern Ave, Chiang Mai', phone: '053-222-0002' },
  { name: 'South Outlet',   code: 'WH-SOUTH', address: '78 Coast Rd, Phuket',         phone: '076-333-0003' },
]

module.exports = {
  name: 'stores',
  tier: 'demo',
  order: 120,
  async run(ctx) {
    const { Store } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const rows = []
    for (const s of STORES) {
      const [store] = await Store.findOrCreate({
        where: { code: s.code, organizationId },
        defaults: { ...s, status: 'active', organizationId, createdBy },
      })
      rows.push(store)
    }
    ctx.set('stores', rows)
  },
}
