/**
 * Thin re-export — credential crypto lives with the LINE domain under shared
 * (ADR-0002). Kept so any residual require of server path still resolves.
 */
module.exports = require('../../../shared/erp/line-integration/services/line.crypto')
