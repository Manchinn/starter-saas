const { DataTypes } = require('sequelize')
const sequelize = require('../../../../server/config/database')

const Sequence = sequelize.define('Sequence', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true , comment: 'ID (รหัส)'},
  code:         { type: DataTypes.STRING(20),  allowNull: false , comment: 'Code (รหัส)'},
  userId:       { type: DataTypes.UUID,        allowNull: true , comment: 'User (ผู้ใช้)'},
  name:         { type: DataTypes.STRING,      allowNull: false , comment: 'Name (ชื่อ)'},
  initialValue: { type: DataTypes.INTEGER,     allowNull: false, defaultValue: 1 },
  runningValue: { type: DataTypes.INTEGER,     allowNull: false, defaultValue: 1 },
  reseedPeriod: {
    type: DataTypes.ENUM('F', 'D', 'M', 'Y'),
    allowNull: false,
    defaultValue: 'F',
    comment: 'F=Fixed(never), D=Daily, M=Monthly, Y=Yearly',
  },
  lastResetDate: { type: DataTypes.DATEONLY, allowNull: true },
  maxValue:      { type: DataTypes.INTEGER,  allowNull: false, defaultValue: 99999 },
  format:        { type: DataTypes.STRING,   allowNull: false, defaultValue: '{####}',
    comment: 'Template: {####}=padded number, {YYYY}=year, {YY}=short year, {MM}=month, {DD}=day' },
})

module.exports = Sequence
