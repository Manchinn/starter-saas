const { DataTypes } = require('sequelize')
const sequelize = require('../../../server/config/database')
const { auditFields } = require('../../erp/model-fields')

// A chat thread owned by a single user.
const AiConversation = sequelize.define('AiConversation', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  userId: { type: DataTypes.UUID, allowNull: false , comment: 'User (ผู้ใช้)'},
  title:  { type: DataTypes.STRING, allowNull: false, defaultValue: 'New chat' , comment: 'Title (หัวข้อ)'},
  ...auditFields,
})

module.exports = AiConversation
