const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../server/middleware/validate')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const controller = require('./approval-threshold.controller')

const router = Router()
router.use(authenticate)

const writeRules = [
  body('docType').optional().isIn(['purchase_order', 'vendor_bill']).withMessage('Invalid document type'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('requiredPermission').optional().isString().notEmpty().withMessage('Required permission is required'),
  validate,
]

router.get('/',          requirePermission('erp.thresholds.list'),   controller.list)
router.get('/:id',       requirePermission('erp.thresholds.list'),   controller.getById)
router.post('/',         requirePermission('erp.thresholds.edit'),   writeRules, controller.create)
router.put('/:id',       requirePermission('erp.thresholds.edit'),   writeRules, controller.update)
router.delete('/:id',    requirePermission('erp.thresholds.edit'),   controller.remove)

module.exports = { mountPath: '/settings/approval-thresholds', router }