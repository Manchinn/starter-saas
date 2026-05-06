const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  },
  activeFrom: { type: DataTypes.DATEONLY, allowNull: true },
  activeTo:   { type: DataTypes.DATEONLY, allowNull: true },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  dataFlag:   { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:  { type: DataTypes.UUID, allowNull: true },
  modifiedBy: { type: DataTypes.UUID, allowNull: true },
})

module.exports = Vendor
