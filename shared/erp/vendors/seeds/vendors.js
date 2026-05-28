// Demo vendors. Published as an ordered array for product-vendor links.
const VENDORS = [
  { code: 'VND-001', name: 'TechSupply Co.',     contactPerson: 'Somchai K.', email: 'somchai@techsupply.th', phone: '02-500-1001', vendorTypes: ['electronics', 'hardware'] },
  { code: 'VND-002', name: 'Office World Ltd.',  contactPerson: 'Nipa S.',    email: 'nipa@officeworld.th',   phone: '02-500-2002', vendorTypes: ['furniture', 'stationery'] },
  { code: 'VND-003', name: 'Clean Pro Supplies', contactPerson: 'Wanchai T.', email: 'wanchai@cleanpro.th',   phone: '038-300-3003', vendorTypes: ['chemicals', 'cleaning'] },
  { code: 'VND-004', name: 'Fresh Foods Import', contactPerson: 'Malee P.',   email: 'malee@freshfoods.th',   phone: '02-400-4004', vendorTypes: ['food', 'beverage'] },
]

module.exports = {
  name: 'vendors',
  tier: 'demo',
  order: 140,
  async run(ctx) {
    const { Vendor } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const rows = []
    for (const v of VENDORS) {
      const [vendor] = await Vendor.findOrCreate({
        where: { code: v.code, organizationId },
        defaults: { ...v, vendorTypes: JSON.stringify(v.vendorTypes), status: 'active', organizationId, createdBy },
      })
      rows.push(vendor)
    }
    ctx.set('vendors', rows)
  },
}
