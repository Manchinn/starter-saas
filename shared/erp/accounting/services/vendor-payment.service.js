const { VendorPayment, VendorPaymentBill, VendorBill, Vendor } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { getNext } = require('../../settings/services/sequence.service')

// Accounts-payable disbursement — the payables mirror of receive-payment.service.

const vendorAttrs = ['id', 'name', 'code', 'email', 'phone']
const billAttrs   = ['id', 'billNumber', 'billDate', 'dueDate', 'total', 'amountPaid', 'status']

const lineInclude = {
  model: VendorPaymentBill,
  as: 'lines',
  include: [{ model: VendorBill, as: 'bill', attributes: billAttrs }],
}

const nextRefNo = (userId) => getNext('PMT', userId)
const round2 = (v) => Math.round(Number(v || 0) * 100) / 100

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where  = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [{ refNo: { [Op.like]: `%${search}%` } }, { reference: { [Op.like]: `%${search}%` } }]
  if (status) where.status = status

  const { count, rows } = await VendorPayment.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: Vendor, as: 'vendor', attributes: vendorAttrs }],
    distinct: true,
  })
  return { total: count, page, limit, vendorPayments: rows }
}

const getById = async (id) => {
  const vp = await VendorPayment.findByPk(id, {
    include: [lineInclude, { model: Vendor, as: 'vendor', attributes: vendorAttrs }],
  })
  if (!vp) throw { status: 404, message: 'Vendor Payment not found' }
  return vp
}

// Open bills for a vendor: status 'approved' with balanceDue > 0.
const availableBills = async ({ vendorId, organizationId }) => {
  const bills = await VendorBill.findAll({
    where: { vendorId, organizationId: organizationId || null, status: 'approved', dataFlag: { [Op.ne]: 2 } },
    order: [['billDate', 'DESC']],
    attributes: billAttrs,
  })
  return bills.filter(b => Number(b.balanceDue) > 0)
}

// allocations: [{ vendorBillId, amount }] — amount optional (defaults to balanceDue).
const create = async ({ date, vendorId, paymentMethod, reference, notes, currency, exchangeRate, allocations, billIds = [], userId, organizationId }) => {
  if (!vendorId)      throw { status: 400, message: 'Vendor is required' }
  if (!date)          throw { status: 400, message: 'Date is required' }
  if (!paymentMethod) throw { status: 400, message: 'Payment method is required' }

  const allocs = Array.isArray(allocations) && allocations.length
    ? allocations.map(a => ({ vendorBillId: a.vendorBillId, amount: a.amount != null ? Number(a.amount) : null }))
    : (billIds || []).map(id => ({ vendorBillId: id, amount: null }))
  if (!allocs.length) throw { status: 400, message: 'Select at least one bill' }

  const vendor = await Vendor.findByPk(vendorId)
  if (!vendor) throw { status: 400, message: 'Vendor not found' }

  const billIdSet = [...new Set(allocs.map(a => a.vendorBillId))]
  const bills = await VendorBill.findAll({
    where: { id: { [Op.in]: billIdSet }, vendorId, organizationId: organizationId || null },
  })
  if (bills.length !== billIdSet.length)
    throw { status: 400, message: 'One or more bills not found or do not belong to this vendor' }

  const billMap = new Map(bills.map(b => [b.id, b]))
  let total = 0
  for (const a of allocs) {
    const bill = billMap.get(a.vendorBillId)
    const balance = Number(bill.balanceDue)
    const amount  = a.amount == null ? balance : round2(a.amount)
    if (amount <= 0) throw { status: 400, message: `Allocation for bill ${bill.billNumber} must be greater than 0` }
    if (amount > balance + 0.001) {
      throw { status: 400, message: `Allocation for bill ${bill.billNumber} (${amount}) exceeds outstanding balance (${balance})` }
    }
    a.amount = amount
    total += amount
  }
  total = round2(total)

  const fx = await require('../../settings/services/currency.service').getRateOn(currency, date, organizationId)
  const resolvedRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx
  const refNo = await nextRefNo(userId)

  return sequelize.transaction(async (t) => {
    const vp = await VendorPayment.create({
      refNo, date, vendorId, paymentMethod,
      reference: reference || null,
      notes: notes || null,
      amount: total,
      currency: currency || null,
      exchangeRate: resolvedRate,
      organizationId: organizationId || null,
      createdBy: userId || null, modifiedBy: userId || null,
    }, { transaction: t })

    for (const a of allocs) {
      await VendorPaymentBill.create({
        vendorPaymentId: vp.id,
        vendorBillId:    a.vendorBillId,
        amount:          a.amount,
        organizationId:  organizationId || null,
      }, { transaction: t })
    }
    return getById(vp.id)
  })
}

// Apply (+1) / undo (-1) per-bill allocation effects on amountPaid + status.
// Updates the bill row directly so the bill's own updateStatus (which would
// post its legacy payment journal) is NOT triggered — this payment doc owns the
// GL posting.
const applyAllocations = async (lines, direction) => {
  for (const line of lines) {
    const bill = await VendorBill.findByPk(line.vendorBillId)
    if (!bill) continue
    const delta = direction * Number(line.amount)
    const newPaid = round2(Math.max(0, Number(bill.amountPaid || 0) + delta))
    const isFullySettled = newPaid + 0.001 >= Number(bill.total)
    await bill.update({
      amountPaid: newPaid,
      status:     isFullySettled ? 'paid' : (direction < 0 ? 'approved' : bill.status),
    })
  }
}

const confirm = async (id, userId) => {
  const vp = await VendorPayment.findByPk(id, { include: [lineInclude] })
  if (!vp)                   throw { status: 404, message: 'Vendor Payment not found' }
  if (vp.status !== 'draft') throw { status: 400, message: 'Only draft payments can be confirmed' }
  await require('./tax-period.service').assertOpen(vp.date, vp.organizationId)

  const previousStatus = vp.status
  await vp.update({ status: 'confirmed', modifiedBy: userId || null })

  try {
    await applyAllocations(vp.lines, +1)
    await require('./auto-journal.service').postVendorPayment(await getById(id), userId)
  } catch (err) {
    try { await applyAllocations(vp.lines, -1) } catch (_) { /* primary error wins */ }
    await vp.update({ status: previousStatus })
    throw err
  }
  return getById(id)
}

const cancel = async (id, userId) => {
  const vp = await VendorPayment.findByPk(id, { include: [lineInclude] })
  if (!vp)                       throw { status: 404, message: 'Vendor Payment not found' }
  if (vp.status === 'cancelled') throw { status: 400, message: 'Vendor Payment is already cancelled' }
  if (vp.status === 'confirmed') {
    await require('./tax-period.service').assertOpen(vp.date, vp.organizationId)
  }

  const previousStatus = vp.status
  await vp.update({ status: 'cancelled', modifiedBy: userId || null })

  if (previousStatus === 'confirmed') {
    try {
      await applyAllocations(vp.lines, -1)
      await require('./auto-journal.service').reverseVendorPayment(vp, userId, `vendor payment cancelled from "${previousStatus}"`)
    } catch (err) {
      try { await applyAllocations(vp.lines, +1) } catch (_) {}
      await vp.update({ status: previousStatus })
      throw err
    }
  }
  return getById(id)
}

const remove = async (id) => {
  const vp = await VendorPayment.findByPk(id)
  if (!vp)                   throw { status: 404, message: 'Vendor Payment not found' }
  if (vp.status !== 'draft') throw { status: 400, message: 'Only draft payments can be deleted' }
  await vp.destroy()
}

module.exports = { list, getById, availableBills, create, confirm, cancel, remove }
