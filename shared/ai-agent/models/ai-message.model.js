const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')

// A single message in a conversation. Only user/assistant turns are persisted
// for display; the transient tool/assistant-tool-call turns of the agent loop
// are not stored. `actions` holds any client-side actions the assistant ran
// (e.g. navigate) so the UI can re-render the chips on reload.
const AiMessage = sequelize.define('AiMessage', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  conversationId: { type: DataTypes.UUID, allowNull: false },
  role:           { type: DataTypes.ENUM('user', 'assistant'), allowNull: false },
  content:        { type: DataTypes.TEXT, allowNull: true },
  // JSON string: array of { type, ... } client actions performed for this turn.
  actions:        { type: DataTypes.TEXT, allowNull: true },
})

module.exports = AiMessage
