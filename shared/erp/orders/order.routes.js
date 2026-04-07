const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./order.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')

const router = Router()

router.use(authenticate)

const itemsValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be a positive number'),
  validate,
]

const statusValidation = [
  body('status').isIn(['draft', 'confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  validate,
]

router.get('/',                  requirePermission('erp.orders.list'),   (req, res) => controller.list(req, res))
router.get('/items',             requirePermission('erp.orders.list'),   (req, res) => controller.listItems(req, res))
router.get('/items/:itemId',     requirePermission('erp.orders.list'),   (req, res) => controller.getItemById(req, res))
router.put('/items/:itemId',     requirePermission('erp.orders.edit'),   (req, res) => controller.updateItem(req, res))
router.delete('/items/:itemId',  requirePermission('erp.orders.delete'), (req, res) => controller.deleteItem(req, res))
router.get('/:id',               requirePermission('erp.orders.list'),   (req, res) => controller.getById(req, res))
router.post('/',           requirePermission('erp.orders.edit'),   itemsValidation, (req, res) => controller.create(req, res))
router.put('/:id',         requirePermission('erp.orders.edit'),   (req, res) => controller.update(req, res))
router.patch('/:id/status',requirePermission('erp.orders.edit'),   statusValidation, (req, res) => controller.updateStatus(req, res))
router.delete('/:id',      requirePermission('erp.orders.delete'), (req, res) => controller.remove(req, res))

module.exports = router
