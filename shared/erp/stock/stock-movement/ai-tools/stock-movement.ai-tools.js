// AI tools for the stock-movement controller (mirrors
// stock-movement.controller.js + stock-movement.service.js).
//
// Stock movement is a read-only ledger of every stock change (receive, issue,
// adjust, count, transfer, …). There is nothing to create — the agent only
// queries it. Product is resolved via the products tools' resolveProduct and
// store via the inventory store service (both already on the base branch).

const { resolveProduct } = require('../../../products/ai-tools/product.ai-tools')

const navTargets = {
  stock_movements: { path: '/erp/stock-movements', label: 'Stock Movements' },
}

const movementSvc = () => require('../stock-movement.service')
const storeSvc    = () => require('../../../inventory/services/store.service')
const orgOf = (user) => user?.organizationId || user?.id || null

const slim = (m) => ({
  product: m.product?.name || null,
  sku:     m.product?.sku || null,
  store:   m.store?.name || null,
  type:    m.type,
  qty:     Number(m.qty),
  before:  Number(m.stockBefore),
  after:   Number(m.stockAfter),
  ref:     m.refNo || null,
  at:      m.createdAt,
})

// Resolve a free-text term (name / code) to one store id via the store service.
async function resolveStoreId(term, user) {
  const t = (term || '').trim()
  if (!t) return { id: '' }
  const { stores } = await storeSvc().list({ search: t, limit: 10, organizationId: orgOf(user) })
  if (!stores.length) return { error: `No store matches "${t}".` }
  if (stores.length === 1) return { id: stores[0].id }
  const lc = t.toLowerCase()
  const exact = stores.filter((s) => [s.name, s.code].some((v) => v && String(v).toLowerCase() === lc))
  if (exact.length === 1) return { id: exact[0].id }
  const names = stores.map((s) => `${s.name}${s.code ? ` (${s.code})` : ''}`).join(', ')
  return { error: `Multiple stores match "${t}": ${names}. Be more specific.` }
}

const tools = [
  {
    name: 'get_stock_movements',
    kind: 'server',
    description: 'Show the stock movement ledger — every change to on-hand stock (receive, issue, adjust, '
      + 'count, transfer). Optionally filter by product, store, and movement type. Use when the user asks '
      + 'about stock history or "what changed" for a product.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Optional product name/SKU to filter by.' },
        store:   { type: 'string', description: 'Optional store name/code to filter by.' },
        type:    { type: 'string', description: 'Optional movement type, e.g. receive, issue, adjust, count, transfer.' },
        limit:   { type: 'number', description: 'Max rows to return (default 10).' },
      },
    },
    async handler(args, { user }) {
      let productId = ''
      if (args.product) {
        const { product, error } = await resolveProduct(args.product, user)
        if (error) return { result: error }
        productId = product.id
      }
      let storeId = ''
      if (args.store) {
        const s = await resolveStoreId(args.store, user)
        if (s.error) return { result: s.error }
        storeId = s.id
      }

      const { total, movements } = await movementSvc().list({
        productId,
        storeId,
        type:  (args.type || '').trim(),
        limit: Math.min(Math.max(Number(args.limit) || 10, 1), 50),
      })
      return {
        result: { total, movements: movements.map(slim) },
        action: { type: 'navigate', target: 'stock_movements', path: '/erp/stock-movements', label: 'Stock Movements' },
      }
    },
  },
]

module.exports = { tools, navTargets, slim }
