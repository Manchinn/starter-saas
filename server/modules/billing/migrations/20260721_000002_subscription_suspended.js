/**
 * Add Subscriptions.suspended — admin can block plan access without canceling.
 */
module.exports = {
  async up(ctx) {
    await ctx.addColumn('Subscriptions', 'suspended', {
      type: ctx.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  },
  async down(ctx) {
    await ctx.removeColumn('Subscriptions', 'suspended')
  },
}
