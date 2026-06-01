const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const Product = sequelize.define('Product', {
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
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'SKU (SKU)',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description (คำอธิบาย)',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Price (ราคา)',
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Cost (ต้นทุน)',
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Stock (สต็อก)',
  },
  reorderPoint: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Reorder Point (จุดสั่งซื้อใหม่)',
  },
  reorderQty: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Reorder Qty (จำนวนสั่งซื้อใหม่)',
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'pcs',
    comment: 'Unit (หน่วย)',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Category (หมวดหมู่)',
  },
  sellingUomId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Selling UOM (หน่วยนับขาย)',
  },
  purchasingUomId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Purchasing UOM (หน่วยนับซื้อ)',
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

module.exports = Product
