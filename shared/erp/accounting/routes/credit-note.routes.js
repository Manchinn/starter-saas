const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/credit-note.controller')

const router = Router()
router.use(authenticate)

const createRules = [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
]

// Static routes before /:id
router.get('/customer-invoices',   requirePermission('erp.accounting.list'),   controller.customerInvoices)
router.get('/',                    requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',                 requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',                   requirePermission('erp.accounting.edit'),   createRules, validate, controller.create)
router.post('/:id/issue',          requirePermission('erp.accounting.edit'),   controller.issue)
router.post('/:id/cancel',         requirePermission('erp.accounting.edit'),   controller.cancel)
router.delete('/:id',              requirePermission('erp.accounting.delete'), controller.remove)

module.exports = router
