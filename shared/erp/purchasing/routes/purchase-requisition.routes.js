const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/purchase-requisition.controller')

const router = Router()
router.use(authenticate)

const itemRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.qty').isNumeric().withMessage('Item quantity must be a number'),
]

router.post('/generate-reorder', requirePermission('erp.purchasing.edit'), controller.generateReorder)
router.get('/',                requirePermission('erp.purchasing.list'),   controller.list)
router.get('/:id/orders',     requirePermission('erp.purchasing.list'),   controller.listOrders)
router.get('/:id',             requirePermission('erp.purchasing.list'),   controller.getById)
router.post('/',               requirePermission('erp.purchasing.edit'),
  [body('date').notEmpty().withMessage('Date is required'), ...itemRules], validate, controller.create)
router.put('/:id',             requirePermission('erp.purchasing.edit'),
  [body('date').notEmpty().withMessage('Date is required'), ...itemRules], validate, controller.update)
router.post('/:id/approve',    requirePermission('erp.purchasing.edit'),   controller.approve)
router.post('/:id/reject',     requirePermission('erp.purchasing.edit'),   controller.reject)
router.post('/:id/create-order', requirePermission('erp.purchasing.edit'), controller.createOrder)
router.delete('/:id',          requirePermission('erp.purchasing.delete'), controller.remove)

module.exports = { mountPath: '/purchasing/requisitions', router }