// Performance indexes for this module's models (registry-driven; see
// server/models/audit-index-migration). Split out of the former platform
// migration 20260602_000003_audit_fields_indexes.
const { up, down } = require('../../../../server/models/audit-index-migration')

module.exports = { up: up(__dirname), down: down(__dirname) }
