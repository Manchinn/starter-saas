const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const ProductCategory = sequelize.define('ProductCategory', {
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
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Parent (ลำดับชั้นเหนือ)',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: 'Status (สถานะ)',
  },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active From (วันที่เริ่มใช้งาน)'},
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active To (วันที่สิ้นสุด)'},
  ...auditFields,
})

module.exports = ProductCategory
