const { Router } = require('express')
const controller = require('./stock-request.controller')
const productController = require('../../products/product.controller')
const stockBalanceSvc = require('../stock-balance/stock-balance.service')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')

const router = Router()
router.use(authenticate)

router.get('/stores-lookup', requirePermission('erp.stock.list'), (req, res) => productController.listStores(req, res))

// Returns products that have stock > 0 in the given store
router.get('/store-products', requirePermission('erp.stock.list'), async (req, res, next) => {
  try {
    const { storeId } = req.query
    if (!storeId) return res.json({ data: { products: [] } })
    const rows = await stockBalanceSvc.list({ storeId, includeZero: false })
    const products = rows.map(r => ({
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

module.exports = { mountPath: '/stock-request', router }