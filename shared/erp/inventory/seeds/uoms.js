// Demo units of measure. Keyed by abbreviation for downstream product seeds.
const UOMS = [
  { name: 'Piece',    abbreviation: 'pcs', description: 'Single unit' },
  { name: 'Box',      abbreviation: 'box', description: '12 pieces per box' },
  { name: 'Kilogram', abbreviation: 'kg',  description: 'Weight in kilograms' },
  { name: 'Litre',    abbreviation: 'L',   description: 'Volume in litres' },
  { name: 'Metre',    abbreviation: 'm',   description: 'Length in metres' },
  { name: 'Pack',     abbreviation: 'pk',  description: 'Packaged bundle' },
]

module.exports = {
  name: 'uoms',
  tier: 'demo',
  order: 110,
  async run(ctx) {
    const { UOM } = ctx.models
    const organizationId = ctx.get('orgId')
    const createdBy = ctx.get('adminId')
    const byAbbr = {}
    for (const u of UOMS) {
      const [uom] = await UOM.findOrCreate({
        where: { abbreviation: u.abbreviation, organizationId },
        defaults: { ...u, status: 'active', organizationId, createdBy },
      })
      byAbbr[u.abbreviation] = uom
    }
    ctx.set('uoms', byAbbr)
  },
}
