const { Pricing, OrderItem, Order, Product, sequelize } = require('../../server/models')
const { Op } = require('sequelize')
const { toFixed } = require('../../server/utils/fmt')

const list = async ({ page = 1, limit = 20, search = '', status = '' }) => {
  const offset = (page - 1) * limit
  const where = {}
  if (search) where.name = { [Op.like]: `%${search}%` }
  if (status) where.status = status

  const { count, rows } = await Pricing.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  return { total: count, page, limit, pricings: rows }
}

const getById = async (id) => {
  const pricing = await Pricing.findByPk(id)
  if (!pricing) throw { status: 404, message: 'Pricing not found' }
  return pricing
}

const create = async ({ name, description, unitPrice, currency = 'USD', status = 'active', orderItemId }) => {
  return Pricing.create({ name, description, unitPrice, currency, status, orderItemId: orderItemId || null })
}

const update = async (id, { name, description, unitPrice, currency, status, orderItemId }) => {
  const pricing = await Pricing.findByPk(id)
  if (!pricing) throw { status: 404, message: 'Pricing not found' }
  await pricing.update({
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(unitPrice !== undefined && { unitPrice }),
    ...(currency !== undefined && { currency }),
    ...(status !== undefined && { status }),
    ...(orderItemId !== undefined && { orderItemId: orderItemId || null }),
  })
  return pricing
}

const remove = async (id) => {
  const pricing = await Pricing.findByPk(id)
  if (!pricing) throw { status: 404, message: 'Pricing not found' }
  await pricing.destroy()
}

/**
 * Apply this pricing's unitPrice to the given order items.
 * Only items belonging to draft orders can be updated.
 * Recalculates each affected order's totals.
 */
const applyToOrderItems = async (id, orderItemIds) => {
  const pricing = await Pricing.findByPk(id)
  if (!pricing) throw { status: 404, message: 'Pricing not found' }
  if (!orderItemIds || !orderItemIds.length) throw { status: 400, message: 'No order items selected' }

  return sequelize.transaction(async (t) => {
    const items = await OrderItem.findAll({
      where: { id: orderItemIds },
      include: [{ model: Order, as: 'order', attributes: ['id', 'status', 'subtotal', 'tax', 'total'] }],
      transaction: t,
    })

    const nonDraft = items.filter((i) => i.order.status !== 'draft')
    if (nonDraft.length) {
      throw { status: 400, message: `${nonDraft.length} item(s) belong to non-draft orders and cannot be updated` }
    }

    // Update each item's unitPrice and recalc line total
    for (const item of items) {
      const lineTotal = toFixed(item.quantity * pricing.unitPrice, 2)
      await item.update({ unitPrice: pricing.unitPrice, total: lineTotal }, { transaction: t })
    }

    // Recalculate totals for each affected order
    const affectedOrderIds = [...new Set(items.map((i) => i.orderId))]
    for (const orderId of affectedOrderIds) {
      const orderItems = await OrderItem.findAll({ where: { orderId }, transaction: t })
      const subtotal = orderItems.reduce((sum, i) => sum + parseFloat(i.total), 0)
      const order = await Order.findByPk(orderId, { transaction: t })
      const taxRate = parseFloat(order.subtotal) > 0
        ? parseFloat(order.tax) / parseFloat(order.subtotal)
        : 0
      const newTax   = toFixed(subtotal * taxRate, 2)
      const newTotal = toFixed(subtotal + newTax, 2)
      await order.update(
        { subtotal: toFixed(subtotal, 2), tax: newTax, total: newTotal },
        { transaction: t }
      )
    }

    return { applied: items.length, pricingName: pricing.name, unitPrice: pricing.unitPrice }
  })
}

/**
 * Return order items available for pricing assignment.
 * draftOnly=true restricts to draft orders (used by the Apply modal).
 */
const listOrderItems = async ({ search = '', draftOnly = false }) => {
  const where = {}
  if (search) where.productName = { [Op.like]: `%${search}%` }

  const orderInclude = {
    model: Order,
    as: 'order',
    attributes: ['id', 'orderNumber', 'status'],
  }
  if (draftOnly) orderInclude.where = { status: 'draft' }

  const rows = await OrderItem.findAll({
    where,
    include: [
      orderInclude,
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 200,
  })

  return rows
}

module.exports = { list, getById, create, update, remove, applyToOrderItems, listOrderItems }
