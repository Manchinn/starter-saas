const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  refNo:           { type: DataTypes.STRING, allowNull: false , comment: 'Reference No. (เลขอ้างอิง)'},
  date:            { type: DataTypes.DATEONLY, allowNull: false , comment: 'Date (วันที่)'},
  deliveryDate:    { type: DataTypes.DATEONLY, allowNull: true , comment: 'Delivery Date (วันที่กำหนดส่ง)'},
  vendorId:        { type: DataTypes.UUID, allowNull: false , comment: 'Vendor (ผู้ขาย)'},
  requisitionId:   { type: DataTypes.UUID, allowNull: true , comment: 'Purchase Requisition (ใบขอซื้อ)'},
  notes:           { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  status:          { type: DataTypes.ENUM('draft', 'confirmed', 'received', 'cancelled'), defaultValue: 'draft' , comment: 'Status (สถานะ)'},
  currency:        { type: DataTypes.STRING(3), allowNull: true , comment: 'Currency (สกุลเงิน)'},
  exchangeRate:    { type: DataTypes.DECIMAL(20, 8), allowNull: false, defaultValue: 1 , comment: 'Exchange Rate (อัตราแลกเปลี่ยน)'},
  ...auditFields,
}, { tableName: 'PurchaseOrders', timestamps: true })

module.exports = PurchaseOrder
