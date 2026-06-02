// AI tools for the audit controller (mirrors audit.controller.js +
// audit.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user } (the authenticated user) and return { result, action? }.
//
// The audit log is read-only — these tools only query it. There are
// deliberately no create/update/delete tools: audit rows are written by the
// system as a side effect of business operations, never by hand.

const navTargets = {
  audit_log: { path: '/erp/settings/audit-log', label: 'Audit Log' },
}

const auditSvc = () => require('../audit.service')

// orgIdOf() equivalent — audit rows are scoped to organizationId || the user id.
const orgOf = (user) => user?.organizationId || user?.id || null

// Shape an audit row into a compact, model-friendly object.
const slim = (r) => ({
  id:         r.id,
  action:     r.action,
  entityType: r.entityType,
  entityId:   r.entityId || null,
  user:       r.userEmail || null,
  summary:    r.summary || null,
  at:         r.createdAt,
})

const tools = [
  {
    name: 'list_audit_logs',
    kind: 'server',
    description: 'Search the audit log — who did what, and when. Use when the user asks about activity, '
      + 'history, changes, or "who modified/created/deleted" something. Filter by action (partial match, '
      + 'e.g. "invoice.send", "delete"), entity type (e.g. "Invoice", "Customer"), and a date range.',
    parameters: {
      type: 'object',
      properties: {
        action:     { type: 'string', description: 'Partial action filter, e.g. "create", "invoice.send".' },
        entityType: { type: 'string', description: 'Exact entity type, e.g. "Invoice", "Customer".' },
        dateFrom:   { type: 'string', description: 'Only events on/after this ISO date (YYYY-MM-DD).' },
        dateTo:     { type: 'string', description: 'Only events on/before this ISO date (YYYY-MM-DD).' },
        limit:      { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, logs } = await auditSvc().list({
        action:     (args.action || '').trim(),
        entityType: (args.entityType || '').trim(),
        dateFrom:   (args.dateFrom || '').trim(),
        dateTo:     (args.dateTo || '').trim(),
        limit:      Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, logs: logs.map(slim) },
        action: { type: 'navigate', target: 'audit_log', path: '/erp/settings/audit-log', label: 'Audit Log' },
      }
    },
  },

  {
    name: 'get_entity_history',
    kind: 'server',
    description: 'Get the full audit trail for one specific record, given its entity type and id. '
      + 'Use when the user asks for the history/changes of a particular invoice, customer, order, etc.',
    parameters: {
      type: 'object',
      properties: {
        entityType: { type: 'string', description: 'Entity type, e.g. "Invoice", "Customer" (required).' },
        entityId:   { type: 'string', description: 'The record id (required).' },
        limit:      { type: 'number', description: 'Max events to return (default 20).' },
      },
      required: ['entityType', 'entityId'],
    },
    async handler(args, { user }) {
      const entityType = (args.entityType || '').trim()
      const entityId = (args.entityId || '').trim()
      if (!entityType || !entityId) {
        return { result: 'Provide both the entity type (e.g. "Invoice") and the record id to fetch its history.' }
      }
      const { total, logs } = await auditSvc().list({
        entityType,
        entityId,
        limit: Math.min(Math.max(Number(args.limit) || 20, 1), 100),
        organizationId: orgOf(user),
      })
      if (!total) return { result: `No audit history found for ${entityType} ${entityId}.` }
      return {
        result: { entityType, entityId, total, history: logs.map(slim) },
        action: { type: 'navigate', target: 'audit_log', path: '/erp/settings/audit-log', label: 'Audit Log' },
      }
    },
  },
]

module.exports = { tools, navTargets, slim }
