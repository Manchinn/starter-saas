/**
 * PlanChangeRequests — tenant plan requests awaiting admin approval.
 * Guarded so it no-ops when the table already exists.
 */
module.exports = {
  async up(ctx) {
    if (await ctx.tableExists('PlanChangeRequests')) return
    const { DataTypes, queryInterface: qi } = ctx
    await qi.createTable('PlanChangeRequests', {
      id: { type: DataTypes.UUID, primaryKey: true },
      organizationId: { type: DataTypes.UUID, allowNull: false },
      planId: { type: DataTypes.UUID, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'canceled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      note: { type: DataTypes.TEXT, allowNull: true },
      decidedBy: { type: DataTypes.UUID, allowNull: true },
      decidedAt: { type: DataTypes.DATE, allowNull: true },
      decisionNote: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE },
      updatedAt: { type: DataTypes.DATE },
    })
  },
  async down(ctx) {
    if (await ctx.tableExists('PlanChangeRequests')) {
      await ctx.queryInterface.dropTable('PlanChangeRequests')
    }
  },
}
