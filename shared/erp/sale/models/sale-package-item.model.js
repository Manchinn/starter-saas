const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { recordFields } = require('../../model-fields')

const SalePackageItem = sequelize.define('SalePackageItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID (รหัส)',
  },
  packageId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Package (แพ็กเกจ)',
  },
  saleItemId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1,
    allowNull: false,
    comment: 'Quantity (จำนวน)',
  },
  unitPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: 'Unit Price (ราคาต่อหน่วย)',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Notes (หมายเหตุ)',
  },
  ...recordFields,
}, {
  tableName: 'sale_package_items',
})

module.exports = SalePackageItem
