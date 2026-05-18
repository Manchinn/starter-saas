const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const PurchaseRequisitionItem = sequelize.define('PurchaseRequisitionItem', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requisitionId:   { type: DataTypes.UUID, allowNull: false },
  productId:       { type: DataTypes.UUID, allowNull: true },
  description:     { type: DataTypes.STRING, allowNull: true },
  qty:             { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 1 },
  unitPrice:       { type: DataTypes.DECIMAL(15, 4), allowNull: true },
  notes:           { type: DataTypes.TEXT, allowNull: true },
  organizationId:  { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'PurchaseRequisitionItems', timestamps: true })

module.exports = PurchaseRequisitionItem
