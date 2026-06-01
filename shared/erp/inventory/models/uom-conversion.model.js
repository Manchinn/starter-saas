const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const UOMConversion = sequelize.define('UOMConversion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  fromUomId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'From UOM (จากหน่วย)',
  },
  toUomId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'To UOM (ถึงหน่วย)',
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
    comment: 'Notes (หมายเหตุ)',
  },
  ...auditFields,
})

module.exports = UOMConversion
