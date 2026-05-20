const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./invoice.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')

const router = Router()
router.use(authenticate)

const itemsValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Item quantity must be greater than 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be a positive number'),
  validate,
]

const statusValidation = [
  body('status').isIn(['draft', 'sent', 'paid', 'cancelled']).withMessage('Invalid status'),
  validate,
]

router.get('/',                requirePermission('erp.invoices.list'),   (req, res) => controller.list(req, res))
router.get('/:id',             requirePermission('erp.invoices.list'),   (req, res) => controller.getById(req, res))
router.post('/',               requirePermission('erp.invoices.edit'),   itemsValidation, (req, res) => controller.create(req, res))
router.put('/:id',             requirePermission('erp.invoices.edit'),   (req, res) => controller.update(req, res))
router.patch('/:id/status',    requirePermission('erp.invoices.edit'),   statusValidation, (req, res) => controller.updateStatus(req, res))
router.post('/:id/create-receipt', requirePermission('erp.receipts.edit'), (req, res) => controller.createReceipt(req, res))
router.delete('/:id',          requirePermission('erp.invoices.delete'), (req, res) => controller.remove(req, res))

module.exports = router
