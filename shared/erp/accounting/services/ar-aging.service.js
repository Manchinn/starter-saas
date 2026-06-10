const { Invoice, Customer } = require('../../../../server/models')
const { Op } = require('sequelize')

const BUCKETS = ['current', 'days1_30', 'days31_60', 'days61_90', 'days91plus']

function emptyBuckets() {
  return { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91plus: 0, total: 0 }
}

function getBucket(dueDate, today) {
  if (!dueDate) return 'current'
  const days = Math.floor((today - new Date(dueDate)) / 86400000)
  if (days <= 0)  return 'current'
  if (days <= 30) return 'days1_30'
  if (days <= 60) return 'days31_60'
  if (days <= 90) return 'days61_90'
  return 'days91plus'
}

const getReport = async ({ asOfDate, customerId, organizationId }) => {
  const today = asOfDate ? new Date(asOfDate) : new Date()
  // Normalize to start of day
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  const where = {
    status: 'sent',
    organizationId: organizationId || null,
    dataFlag: { [Op.ne]: 2 },
  }
  if (customerId) where.customerId = customerId

  const invoices = await Invoice.findAll({
    where,
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'company', 'email', 'phone'] }],
    order: [['dueDate', 'DESC'], ['invoiceDate', 'DESC']],
  })

  const summary = emptyBuckets()
  const customerMap = new Map()

  for (const inv of invoices) {
    const bucket = getBucket(inv.dueDate, today)
    const amount = Number(inv.total)
    const days   = inv.dueDate
      ? Math.max(0, Math.floor((today - new Date(inv.dueDate)) / 86400000))
      : 0

    summary[bucket] += amount
    summary.total   += amount

    const cid = inv.customerId || 'unknown'
    if (!customerMap.has(cid)) {
      customerMap.set(cid, {
        customer: inv.customer || { id: null, name: 'Unknown', company: null, email: null, phone: null },
        invoices: [],
        summary:  emptyBuckets(),
      })
    }
    const entry = customerMap.get(cid)
    entry.invoices.push({
      id:            inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate:   inv.invoiceDate,
      dueDate:       inv.dueDate,
      total:         amount,
      daysOverdue:   days,
      bucket,
    })
    entry.summary[bucket] += amount
    entry.summary.total   += amount
  }

  // Round all totals
  const round2 = v => Math.round(v * 100) / 100
  for (const b of [...BUCKETS, 'total']) summary[b] = round2(summary[b])
  for (const [, entry] of customerMap) {
    for (const b of [...BUCKETS, 'total']) entry.summary[b] = round2(entry.summary[b])
  }

  // Sort customers by total descending
  const customers = [...customerMap.values()].sort((a, b) => b.summary.total - a.summary.total)

  return { asOfDate: todayStr, summary, customers }
}

module.exports = { getReport }
