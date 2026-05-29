const { DataTypes } = require('sequelize')

const auditFields = {
  organizationId: { type: DataTypes.UUID, allowNull: true },
  dataFlag:       { type: DataTypes.INTEGER, defaultValue: 1 },
  createdBy:      { type: DataTypes.UUID, allowNull: true },
  modifiedBy:     { type: DataTypes.UUID, allowNull: true },
  createdAt:      { type: DataTypes.DATE, allowNull: true },
  updatedAt:      { type: DataTypes.DATE, allowNull: true },
}

module.exports = { auditFields }
