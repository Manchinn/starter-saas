// Seeds the HRMS permission catalog from the function permissions declared by
// the ERP, Reporting, AI Assistant and HRMS modules. Idempotent — matched by
// slug, so re-running picks up newly-declared module permissions.
const erpModule       = require('../../erp/erp.module')
const reportingModule = require('../../reporting/reporting.module')
const aiModule        = require('../../ai-agent/ai-agent.module')
const hrmsModule      = require('../hrms.module')

const SOURCE_MODULES = [erpModule, reportingModule, aiModule, hrmsModule]

const MODULE_LABELS = { erp: 'ERP', reporting: 'Reporting', 'ai-agent': 'AI Assistant', hrms: 'HRMS' }
const ACTION_LABELS = {
  list: 'View', view: 'View', edit: 'Manage', manage: 'Manage',
  delete: 'Delete', approve: 'Approve', use: 'Use', settings: 'Settings',
}

const humanize = (s) => String(s).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// `erp.customers.list` → { name: 'View Customers', group: 'ERP · Customers', module: 'erp' }
function derive(slug) {
  const parts       = slug.split('.')
  const moduleSlug  = parts[0]
  const action      = parts[parts.length - 1]
  const entityParts = parts.slice(1, -1)
  const moduleLabel = MODULE_LABELS[moduleSlug] || humanize(moduleSlug)
  const entityLabel = entityParts.length ? humanize(entityParts.join(' ')) : moduleLabel
  const actionLabel = ACTION_LABELS[action] || humanize(action)
  const name  = action === 'settings' ? `${entityLabel} Settings` : `${actionLabel} ${entityLabel}`
  const group = entityParts.length ? `${moduleLabel} · ${entityLabel}` : moduleLabel
  return { slug, name, group, module: moduleSlug, description: `${name} (${slug})` }
}

module.exports = {
  name: 'hrms-permissions',
  tier: 'core',
  order: 15,
  async run(ctx) {
    const { HrmsPermission } = ctx.models
    const bySlug = {}
    for (const mod of SOURCE_MODULES) {
      for (const slug of (mod.permissions || [])) {
        const data = derive(slug)
        const [perm] = await HrmsPermission.findOrCreate({ where: { slug }, defaults: data })
        bySlug[slug] = perm
      }
    }
    ctx.set('hrmsPermissions', bySlug)
  },
}
