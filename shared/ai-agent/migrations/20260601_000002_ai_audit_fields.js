// Adds organizationId, dataFlag, createdBy, modifiedBy to the three AI Agent
// tables so they participate in the standard multi-tenant audit pattern.
// createdAt / updatedAt already exist (Sequelize timestamps) — skipped.
module.exports = {
  async up(ctx) {
    const { DataTypes } = ctx
    const tables = ['AiConversations', 'AiMessages', 'AiSettings']

    for (const table of tables) {
      await ctx.addColumn(table, 'organizationId', { type: DataTypes.UUID, allowNull: true })
      await ctx.addColumn(table, 'dataFlag',       { type: DataTypes.INTEGER, defaultValue: 1 })
      await ctx.addColumn(table, 'createdBy',      { type: DataTypes.UUID, allowNull: true })
      await ctx.addColumn(table, 'modifiedBy',     { type: DataTypes.UUID, allowNull: true })
    }

    // Index org scoping on Conversations and Settings (most-queried).
    await ctx.addIndex('AiConversations', ['organizationId'])
    await ctx.addIndex('AiSettings',      ['organizationId'])
  },

  async down(ctx) {
    const tables = ['AiConversations', 'AiMessages', 'AiSettings']
    for (const table of tables) {
      await ctx.removeColumn(table, 'organizationId')
      await ctx.removeColumn(table, 'dataFlag')
      await ctx.removeColumn(table, 'createdBy')
      await ctx.removeColumn(table, 'modifiedBy')
    }
  },
}
