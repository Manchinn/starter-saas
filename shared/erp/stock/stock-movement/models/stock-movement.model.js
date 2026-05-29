const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockMovement = sequelize.define('StockMovement', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productId:   { type: DataTypes.UUID, allowNull: false },
  type:        { type: DataTypes.STRING, allowNull: false },
  qty:         { type: DataTypes.INTEGER, allowNull: false },
  stockBefore: { type: DataTypes.INTEGER, allowNull: false },
  stockAfter:  { type: DataTypes.INTEGER, allowNull: false },
  refType:     { type: DataTypes.STRING, allowNull: true },
  refId:       { type: DataTypes.UUID, allowNull: true },
  storeId:     { type: DataTypes.UUID, allowNull: true },
  refNo:       { type: DataTypes.STRING, allowNull: true },
  notes:          { type: DataTypes.TEXT, allowNull: true },
  ...auditFields,
})

module.exports = StockMovement
