const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockRequestItem = sequelize.define('StockRequestItem', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  stockRequestId: { type: DataTypes.UUID, allowNull: false },
  productId:      { type: DataTypes.UUID, allowNull: false },
  qty:            { type: DataTypes.INTEGER, allowNull: false },
  notes:          { type: DataTypes.STRING, allowNull: true },
  ...auditFields,
})

module.exports = StockRequestItem
