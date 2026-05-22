const { Router } = require('express')
const controller = require('./stock-count.controller')
const productController = require('../../products/controllers/product.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')

const router = Router()
router.use(authenticate)

router.get('/stores-lookup',   requirePermission('erp.stock.list'), (req, res) => productController.listStores(req, res))
router.get('/store-products',  requirePermission('erp.stock.list'), (req, res) => controller.getStoreProducts(req, res))
router.get('/',                requirePermission('erp.stock.list'), (req, res) => controller.list(req, res))
router.get('/:id',             requirePermission('erp.stock.list'), (req, res) => controller.getById(req, res))
router.get('/check-lock/:storeId', requirePermission('erp.stock.list'), (req, res) => controller.checkLock(req, res))
router.post('/',               requirePermission('erp.stock.edit'), (req, res) => controller.create(req, res))
router.put('/:id',             requirePermission('erp.stock.edit'), (req, res) => controller.update(req, res))
router.post('/:id/confirm',    requirePermission('erp.stock.edit'), (req, res) => controller.confirm(req, res))
router.post('/:id/lock',       requirePermission('erp.stock.edit'), (req, res) => controller.lock(req, res))
router.post('/:id/unlock',     requirePermission('erp.stock.edit'), (req, res) => controller.unlock(req, res))
router.delete('/:id',          requirePermission('erp.stock.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/stock-count', router }