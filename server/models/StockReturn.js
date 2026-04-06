const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const StockReturn = sequelize.define('StockReturn', {
  id:     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:  { type: DataTypes.STRING, allowNull: false, unique: true },
  date:   { type: DataTypes.DATEONLY, allowNull: false },
  type:   { type: DataTypes.STRING, allowNull: false, defaultValue: 'customer_return' }, // customer_return | vendor_return
  storeId:    { type: DataTypes.UUID, allowNull: true },
  customerId: { type: DataTypes.UUID, allowNull: true },
  vendorId:   { type: DataTypes.UUID, allowNull: true },
  notes:  { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'draft' }, // draft | confirmed
})

module.exports = StockReturn
