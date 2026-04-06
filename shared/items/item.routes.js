const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./item.controller')
const { authenticate } = require('../../server/middleware/auth')
const { requirePermission } = require('../../server/middleware/permission')
const { validate } = require('../../server/middleware/validate')

const router = Router()

router.use(authenticate)

const titleValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  validate,
]

router.get('/',     requirePermission('items.list'), (req, res) => controller.list(req, res))
router.get('/:id',  requirePermission('items.list'), (req, res) => controller.getById(req, res))
router.post('/',    requirePermission('items.edit'), titleValidation, (req, res) => controller.create(req, res))
router.put('/:id',  requirePermission('items.edit'), titleValidation, (req, res) => controller.update(req, res))
router.delete('/:id', requirePermission('items.delete'), (req, res) => controller.remove(req, res))

module.exports = router
