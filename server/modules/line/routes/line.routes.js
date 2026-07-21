const { Router } = require('express')
const { authenticate } = require('../../../middleware/auth')
const { requirePermission } = require('../../../middleware/permission')
const { verifyLiffRequest } = require('../line.auth')
const controller = require('../line.controller')

const router = Router()

// The webhook intentionally remains outside JSON-auth middleware. Signature
// verification happens before any LINE event is processed.
router.post('/webhook', controller.webhook)
router.get('/liff/:organizationId/config', controller.publicLiffConfig)
router.use('/admin', authenticate, requirePermission('erp.line-integration.manage'))
router.get('/admin/connection', controller.getConnection)
router.put('/admin/connection', controller.saveConnection)
router.get('/liff/:organizationId/catalog', verifyLiffRequest, controller.catalog)
router.post('/liff/:organizationId/orders', verifyLiffRequest, controller.createOrder)
router.get('/liff/:organizationId/orders', verifyLiffRequest, controller.myOrders)

module.exports = router
