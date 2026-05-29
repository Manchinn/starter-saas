const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockIssueItem = sequelize.define('StockIssueItem', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  stockIssueId: { type: DataTypes.UUID, allowNull: false },
  productId:    { type: DataTypes.UUID, allowNull: false },
  qty:          { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  batchId:      { type: DataTypes.STRING, allowNull: true },
  expiryDate:   { type: DataTypes.DATEONLY, allowNull: true },
  notes:          { type: DataTypes.STRING, allowNull: true },
  ...auditFields,
})

module.exports = StockIssueItem
