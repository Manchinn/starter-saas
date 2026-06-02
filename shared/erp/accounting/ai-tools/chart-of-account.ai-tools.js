// AI tools for the chart-of-account controller (mirrors
// controllers/chart-of-account.controller.js + services/chart-of-account.service.js).
//
// Aggregated into ai-tools/index.js. Handlers run server-side with
// ctx = { user: { id, organizationId } } and return { result, action? }.
//
// Accounting tools are READ-ONLY: the AI can look up and report figures but
// never posts journals or edits the ledger (financial integrity + tax-period
// locks are enforced in the services, not re-implemented here).
//
// The LLM works with account codes/names, not UUIDs, so `resolveAccount` maps a
// free-text term to exactly one account before a report runs against it.

// Reports/services scope by organization, falling back to the user id for
// single-user/internal calls — identical to the accounting controllers.
const orgOf = (user) => user.organizationId || user.id

const navTargets = {
  chart_of_accounts:       { path: '/erp/accounting/chart-of-accounts',        label: 'Chart of Accounts' },
  chart_of_account_create: { path: '/erp/accounting/chart-of-accounts/create', label: 'New Account' },
}

const coaSvc = () => require('../services/chart-of-account.service')

// Shape an account row into a compact, model-friendly object.
const slim = (a) => ({
  code:              a.code,
  name:              a.name,
  accountType:       a.accountType,
  statementCategory: a.statementCategory,
  normalBalance:     a.normalBalance,
  status:            a.status,
})

// Resolve a free-text term (code or name) to one account.
// Returns { account } on a unique hit, or { error } describing why not.
async function resolveAccount(search, user) {
  const term = (search || '').trim()
  if (!term) return { error: 'Provide an account code or name to identify the account.' }

  const { accounts } = await coaSvc().list({ search: term, limit: 10, organizationId: orgOf(user) })
  if (!accounts.length) return { error: `No account matches "${term}".` }
  if (accounts.length === 1) return { account: accounts[0] }

  // Disambiguate an over-broad term by an exact (case-insensitive) code/name match.
  const lc = term.toLowerCase()
  const exact = accounts.filter((a) => [a.code, a.name].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { account: exact[0] }

  const names = accounts.map((a) => `${a.code} ${a.name}`).join(', ')
  return { error: `Multiple accounts match "${term}": ${names}. Be more specific (use the account code).` }
}

const tools = [
  {
    name: 'list_accounts',
    kind: 'server',
    description: 'List or search the chart of accounts. Use when the user asks what accounts exist or to find an account by code or name.',
    parameters: {
      type: 'object',
      properties: {
        search:      { type: 'string', description: 'Optional code or name filter.' },
        accountType: { type: 'string', enum: ['asset', 'liability', 'equity', 'revenue', 'expense'], description: 'Optional account-type filter.' },
        limit:       { type: 'number', description: 'Max rows to return (default 20).' },
      },
    },
    async handler(args, { user }) {
      const { accounts, total } = await coaSvc().list({
        search:      args.search || '',
        accountType: args.accountType || '',
        limit:       Math.min(Math.max(Number(args.limit) || 20, 1), 100),
        organizationId: orgOf(user),
      })
      return {
        result: { total, accounts: accounts.map(slim) },
        action: { type: 'navigate', target: 'chart_of_accounts', path: '/erp/accounting/chart-of-accounts', label: 'Chart of Accounts' },
      }
    },
  },
]

module.exports = { tools, navTargets, resolveAccount, slim, orgOf }
