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
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
})

module.exports = Vendor
