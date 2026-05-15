const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/billing-note.controller')

const router = Router()
router.use(authenticate)

const createRules = [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('invoiceIds').isArray({ min: 1 }).withMessage('Select at least one invoice'),
]

router.get('/available-invoices',  requirePermission('erp.accounting.list'),   controller.availableInvoices)
router.get('/',                    requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',                 requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',                   requirePermission('erp.accounting.edit'),   createRules, validate, controller.create)
router.post('/:id/send',           requirePermission('erp.accounting.edit'),   controller.send)
router.post('/:id/pay',            requirePermission('erp.accounting.edit'),   controller.markPaid)
router.post('/:id/cancel',         requirePermission('erp.accounting.edit'),   controller.cancel)
router.delete('/:id',              requirePermission('erp.accounting.delete'), controller.remove)

module.exports = router
