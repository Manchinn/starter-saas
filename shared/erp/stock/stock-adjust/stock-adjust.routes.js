const { Router } = require('express')
const controller = require('./stock-adjust.controller')
const productController = require('../../products/product.controller')
const stockBalanceSvc = require('../stock-balance/stock-balance.service')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')

const router = Router()
router.use(authenticate)

router.get('/stores-lookup', requirePermission('erp.stock.list'), (req, res) => productController.listStores(req, res))

// Returns ALL active products with their current balance in the given store (balance may be 0)
router.get('/store-products', requirePermission('erp.stock.list'), async (req, res, next) => {
  try {
    const { storeId } = req.query
    if (!storeId) return res.json({ data: { products: [] } })

    // Get only products that have a StoreStock record in this store (balance may be 0)
    const stockRows = await stockBalanceSvc.list({ storeId, includeZero: true })
    const products = stockRows.map(r => ({
      id:    r.product.id,
      name:  r.product.name,
      sku:   r.product.sku,
      stock: r.qty,
    }))

    res.json({ data: { products } })
  } catch (err) { next(err) }
})
router.get('/',              requirePermission('erp.stock.list'),   (req, res) => controller.list(req, res))
router.get('/:id',           requirePermission('erp.stock.list'),   (req, res) => controller.getById(req, res))
router.post('/',             requirePermission('erp.stock.edit'),   (req, res) => controller.create(req, res))
router.post('/:id/confirm',  requirePermission('erp.stock.edit'),   (req, res) => controller.confirm(req, res))
router.delete('/:id',        requirePermission('erp.stock.delete'), (req, res) => controller.remove(req, res))

module.exports = router
