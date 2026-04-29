const { Quotation, QuotationItem, Customer, Product, SaleItem, Order, SalesOrderItem, sequelize } = require('../../../server/models')
const { Op } = require('sequelize')
const { toFixed } = require('../../../server/utils/fmt')
const { getNext } = require('../settings/sequence.service')

const itemIncludes = [
  { model: SaleItem, as: 'saleItem', attributes: ['id', 'name', 'code'] },
  { model: Product,  as: 'product',  attributes: ['id', 'name', 'sku'] },
]

const list = async ({ page = 1, limit = 20, search = '', status = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (status) where.status = status
  if (search) {
    where[Op.or] = [
      { refNo: { [Op.like]: `%${search}%` } },
      { '$customer.name$': { [Op.like]: `%${search}%` } },
    ]
  }

  const { count, rows } = await Quotation.findAndCountAll({
    where,
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'company'] }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    subQuery: false,
  })

  return { total: count, page, limit, quotations: rows }
}

const getById = async (id) => {
  const q = await Quotation.findByPk(id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: QuotationItem, as: 'items', include: itemIncludes },
    ],
  })
  if (!q) throw { status: 404, message: 'Quotation not found' }
  return q
}

function calcTotals(items, taxRate) {
  const subtotal = items.reduce((sum, i) => {
    const disc  = parseFloat(i.discount || 0)
    const price = parseFloat(i.unitPrice) * parseFloat(i.qty)
    return sum + price * (1 - disc / 100)
  }, 0)
  const tax   = toFixed(subtotal * ((parseFloat(taxRate) || 0) / 100), 2)
  const total = toFixed(subtotal + parseFloat(tax), 2)
  return { subtotal: toFixed(subtotal, 2), tax, total }
}

function lineTotal(item) {
  const disc = parseFloat(item.discount || 0)
  return toFixed(parseFloat(item.qty) * parseFloat(item.unitPrice) * (1 - disc / 100), 2)
}

const create = async ({ customerId, quotationDate, validUntil, notes, taxRate = 0, items = [] }) => {
  if (!items.length) throw { status: 400, message: 'Quotation must have at least one item' }

  const refNo = await getNext('QT', null)
  const { subtotal, tax, total } = calcTotals(items, taxRate)

  let createdId
  await sequelize.transaction(async (t) => {
    const q = await Quotation.create({
      refNo,
      customerId:    customerId   || null,
      quotationDate: quotationDate || new Date(),
      validUntil:    validUntil   || null,
      notes,
      subtotal, taxRate, tax, total,
    }, { transaction: t })
    createdId = q.id

    for (const item of items) {
      await QuotationItem.create({
        quotationId: q.id,
        saleItemId:  item.saleItemId  || null,
        productId:   item.productId   || null,
        productName: item.productName || 'Item',
        qty:         item.qty,
        unitPrice:   item.unitPrice,
        discount:    parseFloat(item.discount || 0),
        total:       lineTotal(item),
        notes:       item.notes || null,
      }, { transaction: t })
    }
  })

  return getById(createdId)
}

const update = async (id, { customerId, quotationDate, validUntil, notes, taxRate, items }) => {
  const q = await Quotation.findByPk(id)
  if (!q) throw { status: 404, message: 'Quotation not found' }
  if (q.status !== 'draft') throw { status: 400, message: 'Only draft quotations can be edited' }

  await sequelize.transaction(async (t) => {
    if (items) {
      await QuotationItem.destroy({ where: { quotationId: id }, transaction: t })
      const rate = taxRate !== undefined ? parseFloat(taxRate) : parseFloat(q.taxRate)
      const { subtotal, tax, total } = calcTotals(items, rate)
      await q.update({
        customerId: customerId || null,
        quotationDate, validUntil: validUntil || null, notes,
        taxRate: rate, subtotal, tax, total,
      }, { transaction: t })

      for (const item of items) {
        await QuotationItem.create({
          quotationId: id,
          saleItemId:  item.saleItemId  || null,
          productId:   item.productId   || null,
          productName: item.productName || 'Item',
          qty:         item.qty,
          unitPrice:   item.unitPrice,
          discount:    parseFloat(item.discount || 0),
          total:       lineTotal(item),
          notes:       item.notes || null,
        }, { transaction: t })
      }
    } else {
      await q.update({ customerId: customerId || null, quotationDate, validUntil: validUntil || null, notes }, { transaction: t })
    }
  })

  return getById(id)
}

const VALID_TRANSITIONS = {
  draft:     ['sent'],
  sent:      ['accepted', 'rejected', 'draft'],
  accepted:  ['converted', 'draft'],
  rejected:  ['draft'],
  converted: [],
}

const updateStatus = async (id, status) => {
  const q = await Quotation.findByPk(id)
  if (!q) throw { status: 404, message: 'Quotation not found' }
  const allowed = VALID_TRANSITIONS[q.status] || []
  if (!allowed.includes(status)) {
    throw { status: 400, message: `Cannot transition from '${q.status}' to '${status}'` }
  }
  await q.update({ status })
  return getById(id)
}

const convertToOrder = async (id) => {
  const q = await Quotation.findByPk(id, {
    include: [{ model: QuotationItem, as: 'items' }],
  })
  if (!q) throw { status: 404, message: 'Quotation not found' }
  if (q.status !== 'accepted') throw { status: 400, message: 'Only accepted quotations can be converted to an order' }

  const count = await Order.count()
  const orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`

  let orderId
  await sequelize.transaction(async (t) => {
    const order = await Order.create({
      orderNumber,
      customerId: q.customerId || null,
      orderDate:  q.quotationDate,
      notes:      q.notes,
      subtotal:   q.subtotal,
      tax:        q.tax,
      total:      q.total,
      status:     'draft',
    }, { transaction: t })
    orderId = order.id

    for (const item of q.items) {
      await SalesOrderItem.create({
        orderId:     order.id,
        saleItemId:  item.saleItemId || null,
        productId:   item.productId  || null,
        productName: item.productName,
        quantity:    parseFloat(item.qty),
        unitPrice:   item.unitPrice,
        total:       item.total,
      }, { transaction: t })
    }

    await q.update({ status: 'converted' }, { transaction: t })
  })

  return { quotation: await getById(id), orderId }
}

const remove = async (id) => {
  const q = await Quotation.findByPk(id)
  if (!q) throw { status: 404, message: 'Quotation not found' }
  if (q.status !== 'draft') throw { status: 400, message: 'Only draft quotations can be deleted' }
  await q.destroy()
}

module.exports = { list, getById, create, update, updateStatus, convertToOrder, remove }
