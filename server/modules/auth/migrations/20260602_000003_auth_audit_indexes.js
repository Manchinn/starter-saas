// Performance indexes for the auth core models (User, RefreshToken). These live
// in server/models rather than a sibling models/ dir, so the model list is
// explicit. Split out of the former platform migration
// 20260602_000003_audit_fields_indexes.
const { User, RefreshToken } = require('../../../models')
const { applyIndexes, dropIndexes } = require('../../../models/audit-index-migration')

const MODELS = [User, RefreshToken]

module.exports = {
  up:   (ctx) => applyIndexes(ctx, MODELS),
  down: (ctx) => dropIndexes(ctx, MODELS),
}
