// AI tools for the stock-balance controller (mirrors stock-balance.controller.js
// + stock-balance.service.js).
//
// Stock balance is a read-only report of current on-hand quantities (and a
// per-product summary with recent movements). There is nothing to create — the
// agent only queries. Store/product are resolved from the module's own
// lookups() so this stays self-contained.

const navTargets = {
  stock_balance: { path: '/erp/stock-balance', label: 'Stock Balance' },
}

const balanceSvc = () => require('../stock-balance.service')

const matchOne = (rows, term, fields, label) => {
  const t = (term || '').trim()
  if (!t) return { id: null }
  const lc = t.toLowerCase()
  const exact = rows.filter((r) => fields.some((f) => r[f] && String(r[f]).toLowerCase() === lc))
  if (exact.length === 1) return { row: exact[0] }
  const partial = rows.filter((r) => fields.some((f) => r[f] && String(r[f]).toLowerCase().includes(lc)))
  if (partial.length === 1) return { row: partial[0] }
  if (!partial.length) return { error: `No ${label} matches "${t}".` }
  const names = partial.slice(0, 8).map((r) => r[fields[0]]).join(', ')
  return { error: `Multiple ${label}s match "${t}": ${names}. Be more specific.` }
}

const slim = (b) => ({
  product: b.product?.name || null,
  sku:     b.product?.sku || null,
  store:   b.store?.name || null,
  qty:     b.qty,
  uom:     b.uom?.abbreviation || null,
  value:   b.value,
})

const tools = [
  {
    name: 'get_stock_balance',
    kind: 'server',
    description: 'Show current on-hand stock balances. Optionally filter by store and/or product. Use when '
      + 'the user asks "how much stock", "what\'s on hand", or for inventory levels.',
    parameters: {
      type: 'object',
      properties: {
        store:       { type: 'string', description: 'Optional store name/code to filter by.' },
        product:     { type: 'string', description: 'Optional product name/SKU to filter by.' },
        includeZero: { type: 'boolean', description: 'Include rows with zero stock (default false).' },
        limit:       { type: 'number', description: 'Max rows to return (default 20).' },
      },
    },
    async handler(args, _ctx) {
      let storeId = ''
      let productId = ''
      if (args.store || args.product) {
        const { stores, products } = await balanceSvc().lookups()
        if (args.store) {
          const s = matchOne(stores, args.store, ['name', 'code'], 'store')
          if (s.error) return { result: s.error }
          storeId = s.row?.id || ''
        }
        if (args.product) {
          const p = matchOne(products, args.product, ['name', 'sku'], 'product')
          if (p.error) return { result: p.error }
          productId = p.row?.id || ''
        }
      }

      const rows = await balanceSvc().list({ storeId, productId, includeZero: !!args.includeZero })
      const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 100)
      const totalValue = rows.reduce((s, r) => s + Number(r.value || 0), 0)
      return {
        result: {
          total: rows.length,
          totalValue: Math.round(totalValue * 100) / 100,
          balances: rows.slice(0, limit).map(slim),
        },
        action: { type: 'navigate', target: 'stock_balance', path: '/erp/stock-balance', label: 'Stock Balance' },
      }
    },
  },

  {
    name: 'get_product_stock',
    kind: 'server',
    description: 'Get the on-hand summary for one product: total stock, per-store breakdown, total value, and '
      + 'recent stock movements. Identify the product by name or SKU.',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product name or SKU (required).' },
      },
      required: ['product'],
    },
    async handler(args, _ctx) {
      const { products } = await balanceSvc().lookups()
      const p = matchOne(products, args.product, ['name', 'sku'], 'product')
      if (p.error) return { result: p.error }
      if (!p.row) return { result: 'Provide a product name or SKU.' }

      const s = await balanceSvc().getProductSummary(p.row.id)
      return {
        result: {
          product:    s.product?.name || null,
          sku:        s.product?.sku || null,
          totalStock: s.totalStock,
          totalValue: s.totalValue,
          byStore:    (s.storeStocks || []).map((ss) => ({ store: ss.store?.name || null, qty: Number(ss.stock) })),
          recentMovements: (s.movements || []).map((m) => ({
            type:  m.type,
            qty:   Number(m.qty),
            store: m.store?.name || null,
            at:    m.createdAt,
          })),
        },
        action: { type: 'navigate', target: 'product_stock', path: `/erp/stock-balance/product/${p.row.id}`, label: p.row.name },
      }
    },
  },
]

module.exports = { tools, navTargets, slim }
