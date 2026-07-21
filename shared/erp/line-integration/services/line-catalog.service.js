const productService = require('../../products/services/product.service')

/**
 * LIFF catalog: active products with positive stock at the connection default store.
 * Composition lives in LINE; product reads stay on the products module.
 */
async function listCatalog(connection) {
  if (!connection.defaultStoreId) throw { status: 400, message: 'LINE connection requires a default store' }
  const result = await productService.list({
    page: 1,
    limit: 100,
    status: 'active',
    organizationId: connection.organizationId,
  })
  const stockByProduct = await Promise.all(result.products.map(async (product) => {
    const { storeStocks } = await productService.listStoreStocks(product.id, connection.organizationId)
    return [product.id, Number(storeStocks.find((row) => row.storeId === connection.defaultStoreId)?.stock || 0)]
  }))
  const availableStock = new Map(stockByProduct)
  const products = result.products
    .filter((product) => availableStock.get(product.id) > 0)
    .map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: availableStock.get(product.id),
    }))
  return { products, defaultStoreId: connection.defaultStoreId }
}

module.exports = { listCatalog }
