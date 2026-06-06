// Performance indexes for the roles core models (Role and its join tables
// RoleModule, UserRole). These live in server/models rather than a sibling
// models/ dir, so the model list is explicit. Split out of the former platform
// migration 20260602_000003_audit_fields_indexes.
const { Role, RoleModule, UserRole } = require('../../../models')
const { applyIndexes, dropIndexes } = require('../../../models/audit-index-migration')

const MODELS = [Role, RoleModule, UserRole]

module.exports = {
  up:   (ctx) => applyIndexes(ctx, MODELS),
  down: (ctx) => dropIndexes(ctx, MODELS),
}
