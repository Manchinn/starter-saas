/**
 * Multi-tenant scoping helpers.
 *
 * The tenant key for a request is the caller's organization: a staff user
 * carries `organizationId`; a top-level organization user *is* the org, so its
 * own `id` is the key. Every ERP read-one / update / delete must be scoped to
 * this key — otherwise an authenticated user can reach another org's records by
 * id (cross-tenant IDOR).
 *
 * Usage:
 *   const orgId = orgIdOf(req)                        // in the controller
 *   const row = await findByPkScoped(Order, id, orgId, { include })  // in the service
 *   if (!row) throw { status: 404, message: 'Order not found' }
 */

const orgIdOf = (req) => req?.user?.organizationId || req?.user?.id || null

/**
 * Like Model.findByPk(id, options) but additionally constrains the row to the
 * given organization. Returns null when the id doesn't exist *or* belongs to
 * another org, so callers keep their own 404 (and their own message). Any
 * find options (include / order / attributes / transaction) pass straight
 * through; an explicit `where` is merged with the scope.
 *
 * Security model: the org filter is the request-scoped enforcement point, so
 * every HTTP controller MUST pass a real orgId. When orgId is null/undefined
 * the call is internal/trusted (seeders, migrations, programmatic setup, unit
 * tests with no request context) and falls back to an unscoped findByPk.
 */
async function findByPkScoped(Model, id, orgId, options = {}) {
  if (id == null) return null
  if (orgId == null) return Model.findByPk(id, options)
  const where = { ...(options.where || {}), id, organizationId: orgId }
  return Model.findOne({ ...options, where })
}

/**
 * Guard a referenced record (an FK target supplied by the client) against the
 * caller's org, so a user can't attach another org's customer/product/store to
 * their own document. Throws 404 when missing, 400 on an org mismatch.
 */
function assertSameOrg(record, orgId, label = 'Referenced record') {
  if (!record) throw { status: 404, message: `${label} not found` }
  if (String(record.organizationId) !== String(orgId)) {
    throw { status: 400, message: `${label} does not belong to your organization` }
  }
  return record
}

module.exports = { orgIdOf, findByPkScoped, assertSameOrg }
