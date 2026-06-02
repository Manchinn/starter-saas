// Adds per-user generation options to AiSettings:
//   maxTokens         — cap on tokens generated per reply (null = unlimited)
//   thinkingModel     — reasoning model: ask the model to think, strip <think>
//   promptCompression — send a leaner prompt to fit small context windows
//
// On a fresh database `sequelize.sync()` already creates these from the model;
// this migration backfills existing AiSettings tables. Idempotent per column.
module.exports = {
  async up(ctx) {
    // ctx.addColumn is a no-op when the column already exists, so this is safe
    // to run against both fresh (sync-created) and existing tables.
    await ctx.addColumn('AiSettings', 'maxTokens', {
      type: ctx.DataTypes.INTEGER,
      allowNull: true,
    })
    await ctx.addColumn('AiSettings', 'thinkingModel', {
      type: ctx.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
    await ctx.addColumn('AiSettings', 'promptCompression', {
      type: ctx.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  },
  async down(ctx) {
    await ctx.removeColumn('AiSettings', 'maxTokens')
    await ctx.removeColumn('AiSettings', 'thinkingModel')
    await ctx.removeColumn('AiSettings', 'promptCompression')
  },
}
