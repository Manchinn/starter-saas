const sequelize = require('../config/database')

// ── Core models (auth / platform) ────────────────────────────────────────────
const User           = require('./user.model')
const Module         = require('./module.model')
const UserModule     = require('./user-module.model')
const RefreshToken   = require('./refresh-token.model')
const Role           = require('./role.model')
const Permission     = require('./permission.model')
const RolePermission = require('./role-permission.model')
const RoleModule     = require('./role-module.model')
const UserRole       = require('./user-role.model')
const Plan           = require('./plan.model')
const Subscription   = require('./subscription.model')
const SubscriptionInvoice = require('./subscription-invoice.model')
const UsageCounter   = require('./usage-counter.model')

// ── Shared-layer models ───────────────────────────────────────────────────────
const erpModels  = require('../../shared/erp/models')
const hrmsModels = require('../../shared/hrms/models')
const aiModels   = require('../../shared/ai-agent/models')

// ── Full model registry ───────────────────────────────────────────────────────
const models = {
  sequelize,
  User, Module, UserModule, RefreshToken,
  Role, Permission, RolePermission, RoleModule, UserRole,
  Plan, Subscription, SubscriptionInvoice, UsageCounter,
  ...erpModels,
  ...hrmsModels,
  ...aiModels,
}

// ── Core associations (auth / roles / permissions) ────────────────────────────
require('./core.associations')(models)
require('./billing.associations')(models)

// ── Cross-domain associations (HRMS ↔ core User) ─────────────────────────────
require('../../shared/hrms/models/hrms.association')(models)

// ── Sales order ↔ core User (salesperson) ────────────────────────────────────
models.Order.belongsTo(models.User, { foreignKey: 'salespersonId', as: 'salesperson' })

// ── Quotation ↔ core User (salesperson) ──────────────────────────────────────
models.Quotation.belongsTo(models.User, { foreignKey: 'salespersonId', as: 'salesperson' })

// ── DeliveryOrder ↔ core User (salesperson) ──────────────────────────────────
models.DeliveryOrder.belongsTo(models.User, { foreignKey: 'salespersonId', as: 'salesperson' })

// ── Invoice ↔ core User (salesperson) ────────────────────────────────────────
models.Invoice.belongsTo(models.User, { foreignKey: 'salespersonId', as: 'salesperson' })

module.exports = models
