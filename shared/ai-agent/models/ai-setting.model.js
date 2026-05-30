const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')

// One row per user — stores their personal LLM connection config.
const AiSetting = sequelize.define('AiSetting', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, unique: true },

  // 'ollama' | 'lmstudio'
  provider:    { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ollama' },
  baseUrl:     { type: DataTypes.STRING, allowNull: false, defaultValue: 'http://localhost:11434' },
  model:       { type: DataTypes.STRING, allowNull: false, defaultValue: 'llama3.1' },
  apiKey:      { type: DataTypes.STRING, allowNull: true },          // LM Studio optional bearer
  temperature: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.3 },
  systemPrompt:{ type: DataTypes.TEXT, allowNull: true },
  enabled:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  // When true, actions the assistant returns (e.g. navigate) run automatically
  // without the user having to click the action chip.
  autoAction:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
})

module.exports = AiSetting
