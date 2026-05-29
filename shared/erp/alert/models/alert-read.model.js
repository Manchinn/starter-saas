const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

// Per-user read receipts. The presence of a row means the user has read the
// alert; absence means unread. Kept separate from Alert so one announcement
// can have independent read state per recipient.
const AlertRead = sequelize.define('AlertRead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  alertId: { type: DataTypes.UUID, allowNull: false },
  userId:  { type: DataTypes.UUID, allowNull: false },
  readAt:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  indexes: [
    { unique: true, fields: ['alertId', 'userId'] },
  ],
})

module.exports = AlertRead
