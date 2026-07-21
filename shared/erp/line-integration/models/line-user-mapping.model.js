const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

module.exports = sequelize.define('LineUserMapping', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false },
  lineConnectionId: { type: DataTypes.UUID, allowNull: false },
  customerId: { type: DataTypes.UUID, allowNull: false },
  lineUserId: { type: DataTypes.STRING, allowNull: false },
  displayName: { type: DataTypes.STRING, allowNull: true },
  pictureUrl: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'line_user_mappings',
  indexes: [{ unique: true, fields: ['organizationId', 'lineUserId'] }],
})
