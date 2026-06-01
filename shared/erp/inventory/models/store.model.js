const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Store = sequelize.define('Store', {
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
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Code (รหัส)',
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Address (ที่อยู่)',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Phone (โทรศัพท์)',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email (อีเมล)',
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

module.exports = Store
