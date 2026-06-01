const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { auditFields } = require('../../model-fields')

const TaxPeriod = sequelize.define('TaxPeriod', {
  id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  name:           { type: DataTypes.STRING, allowNull: false , comment: 'Name (ชื่อ)'},
  startDate:      { type: DataTypes.DATEONLY, allowNull: false , comment: 'Start Date (วันที่เริ่มต้น)'},
  endDate:        { type: DataTypes.DATEONLY, allowNull: false , comment: 'End Date (วันที่สิ้นสุด)'},
  status:         { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'open' , comment: 'Status (สถานะ)'},
  notes:          { type: DataTypes.TEXT, allowNull: true , comment: 'Notes (หมายเหตุ)'},
  closedBy:       { type: DataTypes.UUID, allowNull: true },
  closedAt:       { type: DataTypes.DATE, allowNull: true },
  ...auditFields,
}, {
  tableName: 'tax_periods',
  indexes: [
    { fields: ['organizationId', 'startDate', 'endDate'] },
    { fields: ['organizationId', 'status'] },
  ],
})

module.exports = TaxPeriod
