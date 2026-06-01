const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const FiscalYear = sequelize.define('FiscalYear', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  name:           { type: DataTypes.STRING, allowNull: false , comment: 'Name (ชื่อ)'},
  startDate:      { type: DataTypes.DATEONLY, allowNull: false , comment: 'Start Date (วันที่เริ่มต้น)'},
  endDate:        { type: DataTypes.DATEONLY, allowNull: false , comment: 'End Date (วันที่สิ้นสุด)'},
  status:         { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'open' , comment: 'Status (สถานะ)'},
  notes:          { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  ...auditFields,
}, { tableName: 'FiscalYears', timestamps: true })

module.exports = FiscalYear

