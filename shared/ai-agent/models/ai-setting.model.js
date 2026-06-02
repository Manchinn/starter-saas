const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { auditFields } = require('../../erp/model-fields')

// One row per user — stores their personal LLM connection config.
const AiSetting = sequelize.define('AiSetting', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  userId: { type: DataTypes.UUID, allowNull: false, unique: true , comment: 'User (ผู้ใช้)'},

  // 'ollama' | 'lmstudio'
  provider:    { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ollama' , comment: 'Provider (ผู้ให้บริการ)'},
  baseUrl:     { type: DataTypes.STRING, allowNull: false, defaultValue: 'http://localhost:11434' },
  model:       { type: DataTypes.STRING, allowNull: false, defaultValue: 'llama3.1' , comment: 'Model (โมเดล)'},
  apiKey:      { type: DataTypes.STRING, allowNull: true , comment: 'API Key (API Key)'},          // LM Studio optional bearer
  temperature: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.3 , comment: 'Temperature (Temperature)'},
  systemPrompt:{ type: DataTypes.TEXT, allowNull: true , comment: 'System Prompt (System Prompt)'},
  enabled:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true , comment: 'Enabled (เปิดใช้งาน)'},

  // When true, actions the assistant returns (e.g. navigate) run automatically
  // without the user having to click the action chip.
  autoAction:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true , comment: 'Auto Action (ทำงานอัตโนมัติ)'},

  // Max tokens the model may generate per reply. null = unlimited (no cap).
  maxTokens:   { type: DataTypes.INTEGER, allowNull: true , comment: 'Max Tokens (null = unlimited)'},
  // Reasoning/"thinking" model: ask the model to think (Ollama `think`) and strip
  // its <think> reasoning out of the visible reply.
  thinkingModel:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false , comment: 'Thinking Model (โมเดลคิดวิเคราะห์)'},
  // Send a leaner prompt (compact tool schemas + shorter history) to fit small
  // context windows.
  promptCompression:{ type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false , comment: 'Prompt Compression (บีบอัดพรอมต์)'},
  ...auditFields,
})

module.exports = AiSetting
