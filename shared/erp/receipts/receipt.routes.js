const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./receipt.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')

const router = Router()
router.use(authenticate)

const createValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'cheque', 'credit_card', 'other']).withMessage('Invalid payment method'),
  validate,
]

const statusValidation = [
  body('status').isIn(['draft', 'confirmed', 'cancelled']).withMessage('Invalid status'),
  validate,
]

router.get('/',             requirePermission('erp.receipts.list'),   (req, res) => controller.list(req, res))
router.get('/:id',          requirePermission('erp.receipts.list'),   (req, res) => controller.getById(req, res))
router.post('/',            requirePermission('erp.receipts.edit'),   createValidation, (req, res) => controller.create(req, res))
router.put('/:id',          requirePermission('erp.receipts.edit'),   (req, res) => controller.update(req, res))
router.patch('/:id/status', requirePermission('erp.receipts.edit'),   statusValidation, (req, res) => controller.updateStatus(req, res))
router.delete('/:id',       requirePermission('erp.receipts.delete'), (req, res) => controller.remove(req, res))

module.exports = router
