const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./permission.controller')
const { authenticate } = require('../../middleware/auth')
const { requirePermission } = require('../../middleware/permission')
const { validate } = require('../../middleware/validate')

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('permissions.list'), (req, res) => controller.list(req, res))

router.post('/', requirePermission('permissions.manage'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('slug').trim().matches(/^[a-z0-9_.]+$/).withMessage('Slug must be lowercase letters, numbers, dots, or underscores'),
  validate,
], (req, res) => controller.create(req, res))

router.put('/:id', requirePermission('permissions.manage'), (req, res) => controller.update(req, res))
router.delete('/:id', requirePermission('permissions.manage'), (req, res) => controller.remove(req, res))

module.exports = router
