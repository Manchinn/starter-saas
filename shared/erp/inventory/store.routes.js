const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./store.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')

const router = Router()

router.use(authenticate)

const validation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  validate,
]

router.get('/',       requirePermission('erp.stores.list'),   (req, res) => controller.list(req, res))
router.get('/:id',    requirePermission('erp.stores.list'),   (req, res) => controller.getById(req, res))
router.post('/',      requirePermission('erp.stores.edit'),   validation, (req, res) => controller.create(req, res))
router.put('/:id',    requirePermission('erp.stores.edit'),   validation, (req, res) => controller.update(req, res))
router.delete('/:id', requirePermission('erp.stores.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/stores', router }