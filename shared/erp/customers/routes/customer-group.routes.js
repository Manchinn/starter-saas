const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('../controllers/customer-group.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { validate } = require('../../../../server/middleware/validate')

const router = Router()

router.use(authenticate)

const validation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  validate,
]

router.get('/all',   requirePermission('erp.customers.list'),         (req, res) => controller.listAll(req, res))
router.get('/',      requirePermission('erp.customer-groups.list'),   (req, res) => controller.list(req, res))
router.get('/:id',   requirePermission('erp.customer-groups.list'),   (req, res) => controller.getById(req, res))
router.post('/',     requirePermission('erp.customer-groups.edit'),   validation, (req, res) => controller.create(req, res))
router.put('/:id',   requirePermission('erp.customer-groups.edit'),   validation, (req, res) => controller.update(req, res))
router.delete('/:id',requirePermission('erp.customer-groups.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/customer-groups', router }