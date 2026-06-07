const { VendorBill, Vendor } = require('../../../../server/models')
const { Op } = require('sequelize')

// Accounts-Payable aging — the payables mirror of ar-aging.service.
// Ages open vendor bills (status 'approved') into due-date buckets, grouped by
// vendor. Outstanding = total - amountPaid (amountPaid is added by the vendor
// payment feature; absent → treated as 0, so full total ages).

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

const vendorAttrs = ['id', 'name', 'code', 'email', 'phone']
const round2 = v => Math.round(v * 100) / 100

const getReport = async ({ asOfDate, vendorId, organizationId }) => {
  const today = asOfDate ? new Date(asOfDate) : new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  const where = {
    status: 'approved',
    organizationId: organizationId || null,
    dataFlag: { [Op.ne]: 2 },
  }
  if (vendorId) where.vendorId = vendorId

  const bills = await VendorBill.findAll({
    where,
    include: [{ model: Vendor, as: 'vendor', attributes: vendorAttrs }],
    order: [['dueDate', 'ASC'], ['billDate', 'ASC']],
  })

  const summary = emptyBuckets()
  const vendorMap = new Map()

  for (const bill of bills) {
    const outstanding = round2(Number(bill.total) - Number(bill.amountPaid || 0))
    if (outstanding <= 0) continue
    const bucket = getBucket(bill.dueDate, today)
    const days   = bill.dueDate ? Math.max(0, Math.floor((today - new Date(bill.dueDate)) / 86400000)) : 0

    summary[bucket] += outstanding
    summary.total   += outstanding

    const vid = bill.vendorId || 'unknown'
    if (!vendorMap.has(vid)) {
      vendorMap.set(vid, {
        vendor: bill.vendor || { id: null, name: 'Unknown', code: null, email: null, phone: null },
        bills: [],
        summary: emptyBuckets(),
      })
    }
    const entry = vendorMap.get(vid)
    entry.bills.push({
      id:         bill.id,
      billNumber: bill.billNumber,
      billDate:   bill.billDate,
      dueDate:    bill.dueDate,
      total:      outstanding,
      daysOverdue: days,
      bucket,
    })
    entry.summary[bucket] += outstanding
    entry.summary.total   += outstanding
  }

  for (const b of [...BUCKETS, 'total']) summary[b] = round2(summary[b])
  for (const [, entry] of vendorMap) {
    for (const b of [...BUCKETS, 'total']) entry.summary[b] = round2(entry.summary[b])
  }

  const vendors = [...vendorMap.values()].sort((a, b) => b.summary.total - a.summary.total)
  return { asOfDate: todayStr, summary, vendors }
}

module.exports = { getReport }
