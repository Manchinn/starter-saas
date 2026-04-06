const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./order-item.controller')
const { authenticate } = require('../../middleware/auth')
const { requirePermission } = require('../../middleware/permission')
const { validate } = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

router.get('/items-lookup', requirePermission('order-items.list'), (req, res) => controller.listItems(req, res))
router.get('/', requirePermission('order-items.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('order-items.list'), (req, res) => controller.getById(req, res))

router.post('/', requirePermission('order-items.manage'), [
  body('orderId').optional(),
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('itemCode').optional().trim(),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  validate,
], (req, res) => controller.create(req, res))

router.put('/:id', requirePermission('order-items.manage'), [
  body('productName').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('itemCode').optional().trim(),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  validate,
], (req, res) => controller.update(req, res))

router.delete('/:id', requirePermission('order-items.manage'), (req, res) => controller.remove(req, res))

module.exports = router
