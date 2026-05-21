const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/purchase-order.controller')

const router = Router()
router.use(authenticate)

const createRules = [
  body('date').notEmpty().withMessage('Date is required'),
  body('vendorId').notEmpty().withMessage('Vendor is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.qty').isNumeric().withMessage('Item quantity must be a number'),
  body('items.*.unitPrice').isNumeric().withMessage('Item unit price must be a number'),
]

router.get('/',               requirePermission('erp.purchasing.list'),   controller.list)
router.get('/:id',            requirePermission('erp.purchasing.list'),   controller.getById)
router.post('/',              requirePermission('erp.purchasing.edit'),   createRules, validate, controller.create)
router.put('/:id',            requirePermission('erp.purchasing.edit'),   createRules, validate, controller.update)
router.post('/:id/confirm',   requirePermission('erp.purchasing.edit'),   controller.confirm)
router.post('/:id/receive',   requirePermission('erp.purchasing.edit'),   controller.receive)
router.post('/:id/cancel',    requirePermission('erp.purchasing.edit'),   controller.cancel)
router.post('/:id/create-good-receive', requirePermission('erp.stock.edit'), controller.createGoodReceive)
router.delete('/:id',         requirePermission('erp.purchasing.delete'), controller.remove)

module.exports = { mountPath: '/purchasing/orders', router }