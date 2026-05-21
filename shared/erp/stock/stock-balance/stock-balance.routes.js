const { Router } = require('express')
const controller = require('./stock-balance.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')

const router = Router()
router.use(authenticate)

router.get('/lookups',              requirePermission('erp.stock.list'), (req, res) => controller.lookups(req, res))
router.get('/product/:productId',  requirePermission('erp.stock.list'), (req, res) => controller.getProductSummary(req, res))
router.get('/',                    requirePermission('erp.stock.list'), (req, res) => controller.list(req, res))

module.exports = { mountPath: '/stock-balance', router }