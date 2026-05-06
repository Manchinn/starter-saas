const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const UOMConversion = sequelize.define('UOMConversion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fromUomId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  toUomId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  factor: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: false,
    defaultValue: 1,
    comment: 'How many toUom units equals 1 fromUom unit',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:   { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:  { type: DataTypes.UUID, allowNull: true },
  modifiedBy: { type: DataTypes.UUID, allowNull: true },
})

module.exports = UOMConversion
