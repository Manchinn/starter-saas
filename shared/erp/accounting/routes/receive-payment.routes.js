const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/receive-payment.controller')

const router = Router()
router.use(authenticate)

const createRules = [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('invoiceIds').isArray({ min: 1 }).withMessage('Select at least one invoice'),
]

// Static routes before /:id
router.get('/available-invoices', requirePermission('erp.accounting.list'),   controller.availableInvoices)
router.get('/',                   requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',                requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',                  requirePermission('erp.accounting.edit'),   createRules, validate, controller.create)
router.post('/:id/confirm',       requirePermission('erp.accounting.edit'),   controller.confirm)
router.post('/:id/cancel',        requirePermission('erp.accounting.edit'),   controller.cancel)
router.delete('/:id',             requirePermission('erp.accounting.delete'), controller.remove)

module.exports = { mountPath: '/billing/receive-payments', router }