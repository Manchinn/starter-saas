const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockCountItem = sequelize.define('StockCountItem', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  stockCountId: { type: DataTypes.UUID, allowNull: false },
  productId:    { type: DataTypes.UUID, allowNull: false },
  systemQty:    { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  countedQty:     { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  ...auditFields,
})

module.exports = StockCountItem
