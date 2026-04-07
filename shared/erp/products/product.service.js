const { Product, Store, UOM, StoreStock, Vendor } = require('../../../server/models')
const { Op } = require('sequelize')

const includes = [
  { model: Store,  as: 'stores',       attributes: ['id', 'name', 'code'],        through: { attributes: [] } },
  { model: Vendor, as: 'vendors',      attributes: ['id', 'name', 'code'],        through: { attributes: [] } },
  { model: UOM, as: 'sellingUom',    attributes: ['id', 'name', 'abbreviation'] },
  { model: UOM, as: 'purchasingUom', attributes: ['id', 'name', 'abbreviation'] },
]

const list = async ({ page = 1, limit = 20, search = '', createdBy }) => {
  const offset = (page - 1) * limit
  const where = { createdBy: createdBy || null }
  if (search) where[Op.or] = [
    { name:     { [Op.like]: `%${search}%` } },
    { sku:      { [Op.like]: `%${search}%` } },
    { category: { [Op.like]: `%${search}%` } },
  ]

  const { count, rows } = await Product.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: includes,
    distinct: true,
  })

  return { total: count, page, limit, products: rows }
}

const getById = async (id) => {
  const product = await Product.findByPk(id, { include: includes })
  if (!product) throw { status: 404, message: 'Product not found' }
  return product
}

const create = async ({ name, sku, description, cost, category, sellingUomId, purchasingUomId, status = 'active', storeIds = [], vendorIds = [], userId }) => {
  if (!name?.trim()) throw { status: 400, message: 'Name is required' }
  if (sku?.trim()) {
    const existing = await Product.findOne({ where: { sku: sku.trim(), createdBy: userId || null } })
    if (existing) throw { status: 400, message: 'SKU already exists' }
  }
  const product = await Product.create({ name: name.trim(), sku: sku?.trim() || null, description, price: 0, cost, stock: 0, category, sellingUomId: sellingUomId || null, purchasingUomId: purchasingUomId || null, status, createdBy: userId || null })
  if (storeIds.length)  await product.setStores(storeIds)
  if (vendorIds.length) await product.setVendors(vendorIds)
  return getById(product.id)
}

const update = async (id, data, userId) => {
  const product = await Product.findByPk(id)
  if (!product) throw { status: 404, message: 'Product not found' }
  if (data.sku?.trim()) {
    const existing = await Product.findOne({ where: { sku: data.sku.trim(), createdBy: product.createdBy } })
    if (existing && existing.id !== id) throw { status: 400, message: 'SKU already exists' }
  }
  const allowed = ['name', 'sku', 'description', 'cost', 'category', 'sellingUomId', 'purchasingUomId', 'status']
  const patch = Object.fromEntries(
    Object.entries(data).filter(([k, v]) => allowed.includes(k) && v !== undefined)
  )
  await product.update(patch)
  if (data.storeIds  !== undefined) await product.setStores(data.storeIds)
  if (data.vendorIds !== undefined) await product.setVendors(data.vendorIds)
  return getById(id)
}

const remove = async (id) => {
  const product = await Product.findByPk(id)
  if (!product) throw { status: 404, message: 'Product not found' }
  if (product.stock > 0) throw { status: 400, message: `Cannot delete "${product.name}" — it has ${product.stock} unit(s) on hand. Adjust stock to zero first.` }
  await product.destroy()
}

const listStores = async () => {
  return Store.findAll({ where: { status: 'active' }, attributes: ['id', 'name', 'code'], order: [['name', 'ASC']] })
}

const listStoreStocks = async (productId) => {
  const product = await Product.findByPk(productId)
  if (!product) throw { status: 404, message: 'Product not found' }
  const storeStocks = await StoreStock.findAll({
    where: { productId },
    include: [{ model: Store, as: 'store', attributes: ['id', 'name', 'code'] }],
    order: [[{ model: Store, as: 'store' }, 'name', 'ASC']],
  })
  return { totalStock: product.stock, storeStocks }
}

module.exports = { list, getById, create, update, remove, listStores, listStoreStocks }
