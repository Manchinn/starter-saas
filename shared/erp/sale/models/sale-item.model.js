const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const SaleItem = sequelize.define('SaleItem', {
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
  productId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Product (สินค้า)',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: 'Status (สถานะ)',
  },
  ...auditFields,
}, {
  tableName: 'sale_items',
  indexes: [
    // Per-organization uniqueness on code (NULL organizationId rows are distinct).
    { unique: true, name: 'idx_sale_items_code_org', fields: ['code', 'organizationId'] },
  ],
})

module.exports = SaleItem
