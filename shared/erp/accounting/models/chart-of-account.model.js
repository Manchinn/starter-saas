const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const ChartOfAccount = sequelize.define('ChartOfAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Code (รหัส)',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name (ชื่อ)',
  },
  accountType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Account Type (ประเภทบัญชี)',
  },
  // TFRS for NPAEs statement line-item classification (see chart-of-account.service.js).
  statementCategory: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Statement Category (หมวดในงบการเงิน)',
  },
  normalBalance: {
    type: DataTypes.ENUM('debit', 'credit'),
    allowNull: false,
    comment: 'Normal Balance (ยอดปกติ)',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description (คำอธิบาย)',
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Parent (ลำดับชั้นเหนือ)',
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: 'Status (สถานะ)',
  },
  ...auditFields,
})

module.exports = ChartOfAccount
