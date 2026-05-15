const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../server/middleware/validate')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const controller = require('./delivery-order.controller')

const router = Router()
router.use(authenticate)

const createRules = [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productName').notEmpty().withMessage('Item product name is required'),
  body('items.*.qty').isNumeric().withMessage('Item quantity must be a number'),
]

router.get('/',              requirePermission('erp.orders.list'),   controller.list)
router.get('/:id',           requirePermission('erp.orders.list'),   controller.getById)
router.post('/',             requirePermission('erp.orders.edit'),   createRules, validate, controller.create)
router.post('/:id/confirm',  requirePermission('erp.orders.edit'),   controller.confirm)
router.post('/:id/ship',     requirePermission('erp.orders.edit'),   controller.ship)
router.post('/:id/deliver',  requirePermission('erp.orders.edit'),   controller.deliver)
router.post('/:id/cancel',   requirePermission('erp.orders.edit'),   controller.cancel)
router.post('/:id/create-invoice', requirePermission('erp.invoices.edit'), controller.createInvoice)
router.delete('/:id',        requirePermission('erp.orders.delete'), controller.remove)

module.exports = router
