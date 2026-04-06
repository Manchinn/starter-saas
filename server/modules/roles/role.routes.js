const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./role.controller')
const { authenticate } = require('../../middleware/auth')
const { requireRole } = require('../../middleware/role')
const { requirePermission } = require('../../middleware/permission')
const { validate } = require('../../middleware/validate')

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('roles.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('roles.list'), (req, res) => controller.getById(req, res))

router.post('/', requirePermission('roles.manage'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('slug').trim().matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase letters, numbers, or hyphens'),
  validate,
], (req, res) => controller.create(req, res))

router.put('/:id', requirePermission('roles.manage'), (req, res) => controller.update(req, res))
router.put('/:id/permissions', requirePermission('roles.manage'), (req, res) => controller.assignPermissions(req, res))
router.put('/:id/modules', requirePermission('roles.manage'), (req, res) => controller.assignModules(req, res))
router.delete('/:id', requirePermission('roles.manage'), (req, res) => controller.remove(req, res))

module.exports = router
