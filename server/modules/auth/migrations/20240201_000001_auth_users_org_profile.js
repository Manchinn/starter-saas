// Organization-profile columns on Users so the top-level org can carry company
// info (name, address, phone, tax id, website, logo) for printed documents.
// (Formerly the standalone scripts/add_org_profile_fields.js.)
const COLUMNS = ['companyName', 'address', 'phone', 'taxId', 'website', 'logoPath']

module.exports = {
  async up(ctx) {
    for (const col of COLUMNS) await ctx.addColumn('Users', col, { type: ctx.DataTypes.TEXT })
  },
  async down(ctx) {
    for (const col of [...COLUMNS].reverse()) await ctx.removeColumn('Users', col)
  },
}
