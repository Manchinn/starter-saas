const { DataTypes } = require('sequelize')
const sequelize = require('../../../../../server/config/database')
const { auditFields } = require('../../../model-fields')

const GoodReceive = sequelize.define('GoodReceive', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refNo:    { type: DataTypes.STRING, allowNull: false, unique: true },
  date:     { type: DataTypes.DATEONLY, allowNull: false },
  supplier: { type: DataTypes.STRING, allowNull: true },
  notes:    { type: DataTypes.TEXT, allowNull: true },
  storeId:  { type: DataTypes.UUID, allowNull: true },
  purchaseOrderId: { type: DataTypes.UUID, allowNull: true },
  status:   { type: DataTypes.STRING, defaultValue: 'draft' },

  docType:          { type: DataTypes.STRING, allowNull: true, defaultValue: 'invoice' },
  invoiceNo:        { type: DataTypes.STRING, allowNull: true },
  invoiceDate:      { type: DataTypes.DATEONLY, allowNull: true },
  deliveryNo:       { type: DataTypes.STRING, allowNull: true },
  invoiceDiscount:  { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  invoiceNetAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
  ...auditFields,
})

module.exports = GoodReceive
