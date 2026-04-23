const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')

const StockRequest = sequelize.define('StockRequest', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:       { type: DataTypes.STRING, allowNull: false, unique: true },
  date:        { type: DataTypes.DATEONLY, allowNull: false },
  fromStoreId: { type: DataTypes.UUID, allowNull: false },
  toStoreId:   { type: DataTypes.UUID, allowNull: false },
  notes:       { type: DataTypes.TEXT, allowNull: true },
  status:      { type: DataTypes.STRING, defaultValue: 'draft' },
})

module.exports = StockRequest
