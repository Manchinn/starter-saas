// AI tools for the Dashboard module — executive reporting.
//
// Auto-discovered by shared/ai-agent/services/tools.js. Dashboard has a single
// controller, so the tools live here directly (no per-controller split needed).
// Each runs server-side with ctx = { user: { id, organizationId } }.
//
// These are read-only reporting tools: they return KPI data as `result` and
// intentionally emit NO navigate action — the model computes/narrates a spoken
// summary for the executive rather than opening the dashboard page.

const navTargets = {
  dashboard: { path: '/erp/dashboard', label: 'Dashboard' },
}

const dashboardSvc = () => require('../dashboard.service')

// Mirror the dashboard controller's tenant scoping: organization when present,
// otherwise fall back to the user id (single-user / internal calls).
const orgOf = (user) => user.organizationId || user.id

// Mirror dashboard.routes.js: GET /stats requires erp.products.list.
const DASHBOARD_READ = ['erp.products.list']

const tools = [
  {
    name: 'executive_summary',
    kind: 'server',
    permissions: DASHBOARD_READ,
    description: 'Get business KPI data — finance (sales MTD, AR/AP, VAT), sales pipeline, inventory health, pending operations, and attention items. Use when the user asks how the business is doing or wants an executive briefing. Returns raw figures; summarize them for the executive in plain language. Does not open any page.',
    parameters: { type: 'object', properties: {} },
    async handler(_args, { user }) {
      const summary = await dashboardSvc().getExecutiveSummary(orgOf(user))
      return { result: summary }
    },
  },

  {
    name: 'financial_summary',
    kind: 'server',
    permissions: DASHBOARD_READ,
    description: 'Get financial KPI data only: sales month-to-date, outstanding AR (with overdue count), outstanding AP, net AR−AP position, and current-period VAT. Returns raw figures; summarize them for the user. Does not open any page.',
    parameters: { type: 'object', properties: {} },
    async handler(_args, { user }) {
      const { finance } = await dashboardSvc().getExecutiveSummary(orgOf(user))
      return { result: finance }
    },
  },

  {
    name: 'inventory_summary',
    kind: 'server',
    permissions: DASHBOARD_READ,
    description: 'Get inventory KPI data: active vs total products, stock on hand, out-of-stock count, and how many items are at/below their reorder point. Returns raw figures; summarize them for the user. Does not open any page.',
    parameters: { type: 'object', properties: {} },
    async handler(_args, { user }) {
      const { inventory } = await dashboardSvc().getExecutiveSummary(orgOf(user))
      return { result: inventory }
    },
  },
]

module.exports = { tools, navTargets }
