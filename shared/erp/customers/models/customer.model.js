const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Code (รหัส)',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name (ชื่อ)',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email (อีเมล)',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Phone (โทรศัพท์)',
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Address (ที่อยู่)',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes (หมายเหตุ)',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: 'Status (สถานะ)',
  },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active From (วันที่เริ่มใช้งาน)'},
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true , comment: 'Active To (วันที่สิ้นสุด)'},
  customerGroupId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Customer Group (กลุ่มลูกค้า)',
  },
  ...auditFields,
})

module.exports = Customer
