const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * PlanChangeRequest — tenant request to move to a plan, awaiting admin approval.
 * Approving activates the subscription (manual provider); the row is also an audit trail.
 */
const PlanChangeRequest = sequelize.define('PlanChangeRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  organizationId: { type: DataTypes.UUID, allowNull: false },
  planId: { type: DataTypes.UUID, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'canceled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  note: { type: DataTypes.TEXT, allowNull: true },
  decidedBy: { type: DataTypes.UUID, allowNull: true },
  decidedAt: { type: DataTypes.DATE, allowNull: true },
  decisionNote: { type: DataTypes.TEXT, allowNull: true },
})

module.exports = PlanChangeRequest
