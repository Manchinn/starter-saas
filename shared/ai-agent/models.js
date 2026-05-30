/**
 * AI Agent model registry — merged into the global registry by
 * server/models/index.js (`...aiModels`). Associations local to this module
 * (conversation ↔ messages) are wired here.
 */
const AiSetting      = require('./models/ai-setting.model')
const AiConversation = require('./models/ai-conversation.model')
const AiMessage      = require('./models/ai-message.model')

AiConversation.hasMany(AiMessage, { foreignKey: 'conversationId', as: 'messages', onDelete: 'CASCADE' })
AiMessage.belongsTo(AiConversation, { foreignKey: 'conversationId', as: 'conversation' })

module.exports = { AiSetting, AiConversation, AiMessage }
