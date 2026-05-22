const { Router } = require('express')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/purchase-order.controller')
const { writeRules } = require('../validators/purchase-order.validators')

const router = Router()
router.use(authenticate)

router.get('/',               requirePermission('erp.purchasing.list'),   controller.list)
router.get('/:id',            requirePermission('erp.purchasing.list'),   controller.getById)
router.post('/',              requirePermission('erp.purchasing.edit'),   writeRules, validate, controller.create)
router.put('/:id',            requirePermission('erp.purchasing.edit'),   writeRules, validate, controller.update)
router.post('/:id/confirm',   requirePermission('erp.purchasing.edit'),   controller.confirm)
router.post('/:id/receive',   requirePermission('erp.purchasing.edit'),   controller.receive)
router.post('/:id/cancel',    requirePermission('erp.purchasing.edit'),   controller.cancel)
router.post('/:id/create-good-receive', requirePermission('erp.stock.edit'), controller.createGoodReceive)
router.delete('/:id',         requirePermission('erp.purchasing.delete'), controller.remove)

module.exports = { mountPath: '/purchasing/orders', router }
