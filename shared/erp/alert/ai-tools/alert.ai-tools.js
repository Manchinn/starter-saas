// AI tools for the alert controller (mirrors
// controllers/alert.controller.js + services/alert.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user } (the authenticated user) and return { result, action? }.
//
// The LLM works with names, not UUIDs: create/update resolve a free-text
// module name and department name to the slug / id the service expects, and
// get/update/delete first resolve a free-text title to exactly one alert.

const navTargets = {
  alerts_list:  { path: '/erp/alerts',        label: 'Alerts' },
  alert_create: { path: '/erp/alerts/create', label: 'New Alert' },
}

const alertSvc = () => require('../services/alert.service')

// orgIdOf() equivalent — alerts are scoped to organizationId || the user id.
const orgOf = (user) => user?.organizationId || user?.id || null

const SEVERITIES = ['info', 'success', 'warning', 'critical']
const SCOPES = ['global', 'module', 'department']

// Shape an alert row into a compact, model-friendly object.
const slim = (a) => ({
  id:         a.id,
  title:      a.title,
  severity:   a.severity,
  scope:      a.scope,
  module:     a.moduleSlug || null,
  department: a.departmentName || null,
  source:     a.source,
  link:       a.link || null,
  expiresAt:  a.expiresAt || null,
  createdAt:  a.createdAt,
})

// Resolve a free-text module name/slug to an installed module slug.
async function resolveModuleSlug(term, user) {
  const t = (term || '').trim()
  if (!t) return { error: 'For a module-scoped alert, pass the module name (e.g. "ERP", "HRMS").' }
  const { modules } = await alertSvc().options(orgOf(user))
  const lc = t.toLowerCase()
  const hit = modules.find((m) => m.slug.toLowerCase() === lc || m.name.toLowerCase() === lc)
    || modules.find((m) => m.name.toLowerCase().includes(lc) || m.slug.toLowerCase().includes(lc))
  if (!hit) return { error: `No module matches "${term}". Available: ${modules.map((m) => m.name).join(', ')}.` }
  return { slug: hit.slug }
}

// Resolve a free-text department name to a department id.
async function resolveDepartmentId(term, user) {
  const t = (term || '').trim()
  if (!t) return { error: 'For a department-scoped alert, pass the department name.' }
  const { departments } = await alertSvc().options(orgOf(user))
  const lc = t.toLowerCase()
  const hit = departments.find((d) => d.name.toLowerCase() === lc)
    || departments.find((d) => d.name.toLowerCase().includes(lc))
  if (!hit) return { error: `No department matches "${term}". Available: ${departments.map((d) => d.name).join(', ') || 'none'}.` }
  return { id: hit.id }
}

// Resolve a free-text title to exactly one alert.
// Returns { alert } on a unique hit, or { error } describing why not.
async function resolveAlert(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide the alert title to identify which alert.' }

  const { alerts } = await alertSvc().listAll({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!alerts.length) return { error: `No alert matches "${term}".` }
  if (alerts.length === 1) return { alert: alerts[0] }

  const lc = term.toLowerCase()
  const exact = alerts.filter((a) => a.title && a.title.toLowerCase() === lc)
  if (exact.length === 1) return { alert: exact[0] }

  const titles = alerts.map((a) => `"${a.title}"`).join(', ')
  return { error: `Multiple alerts match "${term}": ${titles}. Be more specific with the full title.` }
}

// Map scope-dependent free-text targets (module / department) onto the
// moduleSlug / departmentId fields the service stores. Returns { fields } or
// { error }.
async function resolveScopeFields(scope, { module: moduleName, department }, user) {
  if (scope === 'module') {
    const { slug, error } = await resolveModuleSlug(moduleName, user)
    if (error) return { error }
    return { fields: { moduleSlug: slug } }
  }
  if (scope === 'department') {
    const { id, error } = await resolveDepartmentId(department, user)
    if (error) return { error }
    return { fields: { departmentId: id } }
  }
  return { fields: {} }
}

const tools = [
  {
    name: 'create_alert',
    kind: 'server',
    description: 'Create an announcement / notification alert for the organization. '
      + 'Use when the user wants to broadcast, announce, or notify people. '
      + 'Scope controls who sees it: "global" (everyone), "module" (users of one module — pass `module`), '
      + 'or "department" (one department — pass `department`).',
    parameters: {
      type: 'object',
      properties: {
        title:      { type: 'string', description: 'Alert title / headline (required).' },
        body:       { type: 'string', description: 'Optional longer message body.' },
        severity:   { type: 'string', enum: SEVERITIES, description: 'Visual severity (default info).' },
        scope:      { type: 'string', enum: SCOPES, description: 'Audience scope (default global).' },
        module:     { type: 'string', description: 'Module name when scope is "module" (e.g. ERP, HRMS).' },
        department: { type: 'string', description: 'Department name when scope is "department".' },
        link:       { type: 'string', description: 'Optional in-app path to open when clicked (e.g. /erp/invoices).' },
        expiresAt:  { type: 'string', description: 'Optional ISO date/time when the alert auto-hides.' },
      },
      required: ['title'],
    },
    async handler(args, { user }) {
      const scope = args.scope || 'global'
      const { fields, error } = await resolveScopeFields(scope, args, user)
      if (error) return { result: error }

      const alert = await alertSvc().create({
        title:          args.title,
        body:           args.body,
        severity:       args.severity || 'info',
        scope,
        link:           args.link,
        expiresAt:      args.expiresAt,
        ...fields,
        userId:         user.id,
        organizationId: orgOf(user),
      })
      return {
        result: { id: alert.id, title: alert.title, scope: alert.scope, severity: alert.severity },
        action: { type: 'navigate', target: 'alert_edit', path: `/erp/alerts/${alert.id}/edit`, label: alert.title },
      }
    },
  },

  {
    name: 'list_alerts',
    kind: 'server',
    description: 'List or search organization alerts. Use when the user asks what alerts/announcements exist.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional title filter.' },
        scope:  { type: 'string', enum: SCOPES, description: 'Optional scope filter.' },
        limit:  { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      const { total, alerts } = await alertSvc().listAll({
        search: args.search || '',
        scope:  args.scope || '',
        limit:  Math.min(Math.max(Number(args.limit) || 10, 1), 50),
        organizationId: orgOf(user),
      })
      return {
        result: { total, alerts: alerts.map(slim) },
        action: { type: 'navigate', target: 'alerts_list', path: '/erp/alerts', label: 'Alerts' },
      }
    },
  },

  {
    name: 'get_alert',
    kind: 'server',
    description: 'Look up a single alert\'s full details by title.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Title identifying the alert.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { alert, error } = await resolveAlert(args.search, user)
      if (error) return { result: error }
      return {
        result: { ...slim(alert), body: alert.body || null },
        action: { type: 'navigate', target: 'alert_edit', path: `/erp/alerts/${alert.id}/edit`, label: alert.title },
      }
    },
  },

  {
    name: 'update_alert',
    kind: 'server',
    description: 'Update an existing alert. Identify it with `search` (its title); only the fields you pass are changed.',
    parameters: {
      type: 'object',
      properties: {
        search:     { type: 'string', description: 'Title identifying the alert to update.' },
        title:      { type: 'string', description: 'New title.' },
        body:       { type: 'string' },
        severity:   { type: 'string', enum: SEVERITIES },
        scope:      { type: 'string', enum: SCOPES },
        module:     { type: 'string', description: 'Module name when changing scope to "module".' },
        department: { type: 'string', description: 'Department name when changing scope to "department".' },
        link:       { type: 'string' },
        expiresAt:  { type: 'string', description: 'ISO date/time, or empty string to clear.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { alert, error } = await resolveAlert(args.search, user)
      if (error) return { result: error }

      const patch = {}
      for (const f of ['title', 'body', 'severity', 'scope', 'link', 'expiresAt']) {
        if (args[f] !== undefined) patch[f] = args[f]
      }
      // If scope is changing (or module/department retargeting is requested),
      // resolve the targeting field for the effective scope.
      const effectiveScope = patch.scope || alert.scope
      if (patch.scope !== undefined || args.module !== undefined || args.department !== undefined) {
        const { fields, error: scopeErr } = await resolveScopeFields(effectiveScope, args, user)
        if (scopeErr) return { result: scopeErr }
        Object.assign(patch, fields)
      }
      if (!Object.keys(patch).length) return { result: 'Nothing to update — pass at least one field to change.' }

      const updated = await alertSvc().update(alert.id, patch, user.id, orgOf(user))
      return {
        result: { id: updated.id, title: updated.title, scope: updated.scope, updated: Object.keys(patch) },
        action: { type: 'navigate', target: 'alert_edit', path: `/erp/alerts/${updated.id}/edit`, label: updated.title },
      }
    },
  },

  {
    name: 'delete_alert',
    kind: 'server',
    description: 'Delete an alert. Identify it with `search` (its title). This cannot be undone.',
    parameters: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Title identifying the alert to delete.' },
      },
      required: ['search'],
    },
    async handler(args, { user }) {
      const { alert, error } = await resolveAlert(args.search, user)
      if (error) return { result: error }
      const { id, title } = alert
      await alertSvc().remove(id, orgOf(user))
      return {
        result: `Deleted alert "${title}".`,
        action: { type: 'navigate', target: 'alerts_list', path: '/erp/alerts', label: 'Alerts' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveAlert, slim }
