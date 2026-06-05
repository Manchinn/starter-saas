// Adds per-message token accounting to AiMessages:
//   model            — the LLM that produced the assistant turn
//   promptTokens     — input tokens (summed across the agent's tool loop)
//   completionTokens — generated tokens
//   totalTokens      — prompt + completion
//
// On a fresh database sequelize.sync() already creates these from the model;
// this migration backfills existing tables. Idempotent per column.
module.exports = {
  async up(ctx) {
    await ctx.addColumn('AiMessages', 'model',            { type: ctx.DataTypes.STRING,  allowNull: true })
    await ctx.addColumn('AiMessages', 'promptTokens',     { type: ctx.DataTypes.INTEGER, allowNull: true })
    await ctx.addColumn('AiMessages', 'completionTokens', { type: ctx.DataTypes.INTEGER, allowNull: true })
    await ctx.addColumn('AiMessages', 'totalTokens',      { type: ctx.DataTypes.INTEGER, allowNull: true })
  },
  async down(ctx) {
    await ctx.removeColumn('AiMessages', 'model')
    await ctx.removeColumn('AiMessages', 'promptTokens')
    await ctx.removeColumn('AiMessages', 'completionTokens')
    await ctx.removeColumn('AiMessages', 'totalTokens')
  },
}
