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
    comment: 'ID (รหัส)',
  },
  alertId: { type: DataTypes.UUID, allowNull: false , comment: 'Alert (การแจ้งเตือน)'},
  userId:  { type: DataTypes.UUID, allowNull: false , comment: 'User (ผู้ใช้)'},
  readAt:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW , comment: 'Read At (อ่านเมื่อ)'},
}, {
  indexes: [
    { unique: true, fields: ['alertId', 'userId'] },
  ],
})

module.exports = AlertRead
