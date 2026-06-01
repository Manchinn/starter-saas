const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const UOM = sequelize.define('UOM', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name (ชื่อ)',
  },
  abbreviation: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description (คำอธิบาย)',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
    comment: 'Status (สถานะ)',
  },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active From (วันที่เริ่มใช้งาน)'},
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active To (วันที่สิ้นสุด)'},
  ...auditFields,
})

module.exports = UOM
