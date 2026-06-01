const { Router } = require('express')
const controller = require('../controllers/product.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { validate } = require('../../../../server/middleware/validate')
const { writeRules } = require('../validators/product.validators')

const router = Router()

router.use(authenticate)

router.get('/stores-lookup',        requirePermission('erp.products.list'), (req, res) => controller.listStores(req, res))
router.get('/:id/store-stocks',     requirePermission('erp.products.list'), (req, res) => controller.listStoreStocks(req, res))
router.get('/',       requirePermission('erp.products.list'),   (req, res) => controller.list(req, res))
router.get('/:id',    requirePermission('erp.products.list'),   (req, res) => controller.getById(req, res))
router.post('/',      requirePermission('erp.products.edit'),   writeRules, validate, (req, res) => controller.create(req, res))
router.put('/:id',    requirePermission('erp.products.edit'),   writeRules, validate, (req, res) => controller.update(req, res))
router.delete('/:id', requirePermission('erp.products.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/item-master', router }
