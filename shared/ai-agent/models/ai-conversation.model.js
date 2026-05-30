const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')

// A chat thread owned by a single user.
const AiConversation = sequelize.define('AiConversation', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  title:  { type: DataTypes.STRING, allowNull: false, defaultValue: 'New chat' },
})

module.exports = AiConversation
