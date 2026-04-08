const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./pricing.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('erp.pricing.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('erp.pricing.list'), (req, res) => controller.getById(req, res))

router.post('/', requirePermission('erp.pricing.manage'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('currency').optional().isLength({ min: 3, max: 10 }).withMessage('Invalid currency'),
  body('saleItemId').optional({ nullable: true }),
  validate,
], (req, res) => controller.create(req, res))

router.put('/:id', requirePermission('erp.pricing.manage'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('saleItemId').optional({ nullable: true }),
  validate,
], (req, res) => controller.update(req, res))

router.delete('/:id', requirePermission('erp.pricing.manage'), (req, res) => controller.remove(req, res))

module.exports = router
