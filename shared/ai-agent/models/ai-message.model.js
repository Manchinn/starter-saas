const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { auditFields } = require('../../erp/model-fields')

// A single message in a conversation. Only user/assistant turns are persisted
// for display; the transient tool/assistant-tool-call turns of the agent loop
// are not stored. `actions` holds any client-side actions the assistant ran
// (e.g. navigate) so the UI can re-render the chips on reload.
const AiMessage = sequelize.define('AiMessage', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  conversationId: { type: DataTypes.UUID, allowNull: false , comment: 'Conversation (การสนทนา)'},
  role:           { type: DataTypes.ENUM('user', 'assistant'), allowNull: false , comment: 'Role (บทบาท)'},
  content:        { type: DataTypes.TEXT, allowNull: true , comment: 'Content (เนื้อหา)'},
  // JSON string: array of { type, ... } client actions performed for this turn.
  actions:        { type: DataTypes.TEXT, allowNull: true , comment: 'Actions (การกระทำ)'},
  // Token accounting for assistant turns (summed across the agent's tool loop).
  // Null on user turns and on assistant turns from providers that report no usage.
  model:            { type: DataTypes.STRING, allowNull: true , comment: 'Model (โมเดล)'},
  promptTokens:     { type: DataTypes.INTEGER, allowNull: true , comment: 'Prompt tokens (โทเค็นพรอมต์)'},
  completionTokens: { type: DataTypes.INTEGER, allowNull: true , comment: 'Completion tokens (โทเค็นคำตอบ)'},
  totalTokens:      { type: DataTypes.INTEGER, allowNull: true , comment: 'Total tokens (โทเค็นรวม)'},
  ...auditFields,
})

module.exports = AiMessage
