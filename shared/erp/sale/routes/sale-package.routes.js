const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('../controllers/sale-package.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { validate } = require('../../../../server/middleware/validate')

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('erp.sale-packages.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('erp.sale-packages.list'), (req, res) => controller.getById(req, res))

router.post('/', requirePermission('erp.sale-packages.manage'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('code').optional({ nullable: true }),
  body('description').optional({ nullable: true }),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('items.*.saleItemId').optional().isUUID().withMessage('Invalid sale item ID'),
  body('items.*.quantity').optional().isNumeric().withMessage('Quantity must be a number'),
  validate,
], (req, res) => controller.create(req, res))

router.put('/:id', requirePermission('erp.sale-packages.manage'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('code').optional({ nullable: true }),
  body('description').optional({ nullable: true }),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('items.*.saleItemId').optional().isUUID().withMessage('Invalid sale item ID'),
  body('items.*.quantity').optional().isNumeric().withMessage('Quantity must be a number'),
  validate,
], (req, res) => controller.update(req, res))

router.delete('/:id', requirePermission('erp.sale-packages.manage'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/sale-packages', router }