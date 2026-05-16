const { VendorBill, VendorBillItem, Vendor, PurchaseOrder, GoodReceive } = require('../../../../server/models')
const { Op } = require('sequelize')
const sequelize = require('../../../../server/config/database')
const { toFixed } = require('../../../../server/utils/fmt')

const vendorAttrs = ['id', 'name', 'code']
const poAttrs     = ['id', 'refNo', 'date']
const grAttrs     = ['id', 'refNo', 'date']

const itemInclude = { model: VendorBillItem, as: 'items' }

const generateBillNumber = async () => {
  const count = await VendorBill.count()
  return `BILL-${String(count + 1).padStart(5, '0')}`
}

const list = async ({ page = 1, limit = 20, search = '', status = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (search) where[Op.or] = [
    { billNumber:      { [Op.like]: `%${search}%` } },
    { vendorInvoiceNo: { [Op.like]: `%${search}%` } },
  ]
  if (status) where.status = status

  const { count, rows } = await VendorBill.findAndCountAll({
    where, limit, offset,
    order: [['createdAt', 'DESC']],
    include: [{ model: Vendor, as: 'vendor', attributes: vendorAttrs }],
  })
  return { total: count, page, limit, bills: rows }
}

const getById = async (id) => {
  const bill = await VendorBill.findByPk(id, {
    include: [
      itemInclude,
      { model: Vendor,        as: 'vendor',        attributes: vendorAttrs },
      { model: PurchaseOrder, as: 'purchaseOrder', attributes: poAttrs },
      { model: GoodReceive,   as: 'goodReceive',   attributes: grAttrs },
    ],
  })
  if (!bill) throw { status: 404, message: 'Vendor Bill not found' }
  return bill
}

const create = async ({ vendorId, purchaseOrderId, goodReceiveId, vendorInvoiceNo, billDate, dueDate, notes, items = [], taxRate = 0, currency, exchangeRate, userId, organizationId }) => {
  if (!items.length) throw { status: 400, message: 'Bill must have at least one item' }
  const billNumber = await generateBillNumber()
  const subtotal = items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0)
  const tax   = toFixed(subtotal * (Number(taxRate) / 100), 2)
  const total = toFixed(subtotal + tax, 2)
  const fx = await require('../../settings/currency.service').getRateOn(currency, billDate, organizationId)
  const resolvedRate = exchangeRate != null && Number(exchangeRate) > 0 ? Number(exchangeRate) : fx

  let createdId
  await sequelize.transaction(async (t) => {
    const bill = await VendorBill.create({
      billNumber,
      vendorId:        vendorId || null,
      purchaseOrderId: purchaseOrderId || null,
      goodReceiveId:   goodReceiveId || null,
      vendorInvoiceNo: vendorInvoiceNo || null,
      billDate:        billDate || new Date(),
      dueDate:         dueDate || null,
      notes:           notes || null,
      subtotal, tax, total,
      currency:        currency || null,
      exchangeRate:    resolvedRate,
      organizationId:  organizationId || null,
      createdBy:       userId || null,
      modifiedBy:      userId || null,
    }, { transaction: t })
    createdId = bill.id

    for (const item of items) {
      await VendorBillItem.create({
        billId:       bill.id,
        productId:    item.productId || null,
        description:  item.description || 'Item',
        quantity:     item.quantity,
        unitPrice:    item.unitPrice,
        total:        toFixed(Number(item.quantity || 0) * Number(item.unitPrice || 0), 2),
        organizationId: organizationId || null,
      }, { transaction: t })
    }
  })
  return getById(createdId)
}

const updateStatus = async (id, status, userId, user) => {
  const bill = await VendorBill.findByPk(id)
  if (!bill) throw { status: 404, message: 'Vendor Bill not found' }
  if (bill.status === status) return getById(id)
  const TRANSITIONS = {
    draft:     ['approved', 'cancelled'],
    approved:  ['paid', 'cancelled'],
    paid:      [],
    cancelled: [],
  }
  if (!TRANSITIONS[bill.status]?.includes(status)) {
    throw { status: 400, message: `Cannot transition from "${bill.status}" to "${status}"` }
  }

  if (status === 'approved' && user) {
    const thresholds = require('../../settings/approval-threshold.service')
    await thresholds.enforce({ user, docType: 'vendor_bill', amount: Number(bill.total) || 0, organizationId: bill.organizationId })
  }

  const previousStatus = bill.status
  await bill.update({ status })
  const autoJournal = require('./auto-journal.service')
  if (status === 'approved' || status === 'paid') {
    try {
      const fresh = await getById(id)
      if (status === 'approved') await autoJournal.postVendorBill(fresh, userId)
      if (status === 'paid')     await autoJournal.postBillPayment(fresh, userId)
    } catch (err) {
      await bill.update({ status: previousStatus })
      throw err
    }
  }
  if (status === 'cancelled' && ['approved', 'paid'].includes(previousStatus)) {
    try {
      // If was paid, reverse the payment journal first (Cr Cash / Dr AP unwinds), then reverse the AP journal
      if (previousStatus === 'paid') {
        await autoJournal.reverseBillPayment(bill, userId, `bill cancelled from "${previousStatus}"`)
      }
      await autoJournal.reverseVendorBill(bill, userId, `bill cancelled from "${previousStatus}"`)
    } catch (err) {
      await bill.update({ status: previousStatus })
      throw err
    }
  }
  require('../../audit/audit.service').log({ userId, action: `bill.${status}`, entityType: 'VendorBill', entityId: id, summary: { from: previousStatus, to: status, billNumber: bill.billNumber, total: bill.total } })
  return getById(id)
}

const remove = async (id) => {
  const bill = await VendorBill.findByPk(id)
  if (!bill) throw { status: 404, message: 'Vendor Bill not found' }
  if (bill.status !== 'draft') throw { status: 400, message: 'Only draft bills can be deleted' }
  await bill.destroy()
}

module.exports = { list, getById, create, updateStatus, remove }
