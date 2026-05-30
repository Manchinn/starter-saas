// Adds the per-user `autoAction` flag to AiSettings. When true (default), the
// assistant's returned actions (e.g. navigate) run automatically without the
// user clicking the action chip.
module.exports = {
  async up(ctx) {
    await ctx.addColumn('AiSettings', 'autoAction', {
      type: ctx.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    })
  },
  async down(ctx) {
    await ctx.removeColumn('AiSettings', 'autoAction')
  },
}
