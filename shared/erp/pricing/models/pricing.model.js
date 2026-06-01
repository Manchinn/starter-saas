const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Pricing = sequelize.define('Pricing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Code (รหัส)',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name (ชื่อ)',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description (คำอธิบาย)',
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Unit Price (ราคาต่อหน่วย)',
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'USD',
    comment: 'Currency (สกุลเงิน)',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: 'Status (สถานะ)',
  },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active From (วันที่เริ่มใช้งาน)'},
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active To (วันที่สิ้นสุด)'},
  saleItemId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  customerGroupId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Customer Group (กลุ่มลูกค้า)',
  },
  ...auditFields,
})

module.exports = Pricing
