// AI tools for the Dashboard module — executive reporting.
//
// Auto-discovered by shared/ai-agent/services/tools.js. Dashboard has a single
// controller, so the tools live here directly (no per-controller split needed).
// Each runs server-side with ctx = { user: { id, organizationId } } and returns
// { result, action? } — the result is a high-level snapshot the model narrates.

const navTargets = {
  dashboard: { path: '/erp/dashboard', label: 'Dashboard' },
}

const dashboardSvc = () => require('../dashboard.service')

// Mirror the dashboard controller's tenant scoping: organization when present,
// otherwise fall back to the user id (single-user / internal calls).
const orgOf = (user) => user.organizationId || user.id

const dashAction = { type: 'navigate', target: 'dashboard', path: '/erp/dashboard', label: 'Dashboard' }

const tools = [
  {
    name: 'executive_summary',
    kind: 'server',
    description: 'Executive summary of the business: finance (sales MTD, AR/AP, VAT), sales pipeline, inventory health, pending operations, and attention items. Use when the user asks how the business is doing, for a KPI/health overview, or an executive briefing.',
    parameters: { type: 'object', properties: {} },
    async handler(_args, { user }) {
      const summary = await dashboardSvc().getExecutiveSummary(orgOf(user))
      return { result: summary, action: dashAction }
    },
  },

  {
    name: 'financial_summary',
    kind: 'server',
    description: 'Financial snapshot only: sales month-to-date, outstanding AR (with overdue count), outstanding AP, net AR−AP position, and current-period VAT.',
    parameters: { type: 'object', properties: {} },
    async handler(_args, { user }) {
      const { finance } = await dashboardSvc().getExecutiveSummary(orgOf(user))
      return { result: finance, action: dashAction }
    },
  },

  {
    name: 'inventory_summary',
    kind: 'server',
    description: 'Inventory health snapshot: active vs total products, stock on hand, out-of-stock count, and how many items are at/below their reorder point.',
    parameters: { type: 'object', properties: {} },
    async handler(_args, { user }) {
      const { inventory } = await dashboardSvc().getExecutiveSummary(orgOf(user))
      return { result: inventory, action: { type: 'navigate', target: 'products_list', path: '/erp/item-master', label: 'Products' } }
    },
  },
]

module.exports = { tools, navTargets }
