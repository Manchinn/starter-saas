const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockAdjustItem = sequelize.define('StockAdjustItem', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  stockAdjustId: { type: DataTypes.UUID, allowNull: false },
  productId:     { type: DataTypes.UUID, allowNull: false },
  qty:           { type: DataTypes.INTEGER, allowNull: false },
  notes:          { type: DataTypes.STRING, allowNull: true },
  ...auditFields,
})

module.exports = StockAdjustItem
