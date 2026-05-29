const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const StockIssue = sequelize.define('StockIssue', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:   { type: DataTypes.STRING, allowNull: false, unique: true },
  date:    { type: DataTypes.DATEONLY, allowNull: false },
  storeId: { type: DataTypes.UUID, allowNull: true },
  reason:  { type: DataTypes.STRING, allowNull: true },
  notes:   { type: DataTypes.TEXT, allowNull: true },
  status:  { type: DataTypes.STRING, defaultValue: 'draft' },
  ...auditFields,
})

module.exports = StockIssue
