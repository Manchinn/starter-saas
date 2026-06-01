const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Vendor = sequelize.define('Vendor', {
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
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: true,
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
  vendorTypes: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('vendorTypes')
      if (!raw) return []
      try { return JSON.parse(raw) } catch { return [] }
    },
    set(val) {
      this.setDataValue('vendorTypes', JSON.stringify(val || []))
    },
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

module.exports = Vendor
