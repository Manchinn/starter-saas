/**
 * Stock ledger — single shared write path for product / store / movement deltas.
 *
 * Callers own policy (locks, negative checks, package lines, Item.stock, GL).
 * This module only applies a signed qty to balances and records the movement.
 *
 * Locked design: issue #1 (A1, T1, B1, I1, P1, O1, S1, L1, E1).
 */
const { Product, StoreStock, StockMovement } = require('../../../../server/models')

/**
 * Apply one signed stock delta under the caller's transaction.
 *
 * @param {object} input
 * @param {string} input.productId
 * @param {string|null} [input.storeId] - null/omitted → skip StoreStock
 * @param {number} input.qty - signed; becomes movement.qty and balance delta
 * @param {string} input.type - e.g. sale, adjust, issue, receive, …
 * @param {string|null} [input.refType]
 * @param {string|null} [input.refId]
 * @param {string|null} [input.refNo]
 * @param {string|null} [input.notes]
 * @param {string|null} input.organizationId - required key; explicit null allowed
 * @param {import('sequelize').Transaction} input.transaction - required (no self-txn)
 * @returns {Promise<{ movement: object, stockBefore: number, stockAfter: number }>}
 */
const postDelta = async (input) => {
  if (!input || typeof input !== 'object') {
    throw { status: 400, message: 'postDelta input is required' }
  }
  if (!('organizationId' in input)) {
    throw { status: 400, message: 'organizationId is required (may be null)' }
  }
  if (!input.transaction) {
    throw { status: 400, message: 'transaction is required' }
  }
  if (!input.productId) {
    throw { status: 400, message: 'productId is required' }
  }
  if (input.qty === undefined || input.qty === null || input.qty === '') {
    throw { status: 400, message: 'qty is required' }
  }
  if (!input.type) {
    throw { status: 400, message: 'type is required' }
  }

  const {
    productId,
    storeId = null,
    qty,
    type,
    refType = null,
    refId = null,
    refNo = null,
    notes = null,
    organizationId,
    transaction,
  } = input

  const signedQty = parseFloat(qty)
  if (Number.isNaN(signedQty)) {
    throw { status: 400, message: 'qty must be a number' }
  }

  const product = await Product.findByPk(productId, { transaction })
  if (!product) {
    throw { status: 404, message: 'Product not found' }
  }

  const stockBefore = parseFloat(product.stock) || 0
  const stockAfter = stockBefore + signedQty

  await product.update({ stock: stockAfter }, { transaction })

  if (storeId) {
    const [storeStock] = await StoreStock.findOrCreate({
      where: { productId, storeId },
      defaults: { stock: 0 },
      transaction,
    })
    const storeBefore = parseFloat(storeStock.stock) || 0
    await storeStock.update({ stock: storeBefore + signedQty }, { transaction })
  }

  const movement = await StockMovement.create({
    productId,
    storeId: storeId || null,
    type,
    qty: signedQty,
    stockBefore,
    stockAfter,
    refType: refType || null,
    refId: refId || null,
    refNo: refNo || null,
    notes: notes || null,
    organizationId: organizationId ?? null,
  }, { transaction })

  return { movement, stockBefore, stockAfter }
}

module.exports = { postDelta }
