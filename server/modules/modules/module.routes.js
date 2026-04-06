const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./module.controller')
const { authenticate } = require('../../middleware/auth')
const { requireRole } = require('../../middleware/role')
const { validate } = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

// Public (authenticated): list active modules
router.get('/', (req, res) => controller.list(req, res))

// Admin only
router.get('/:id', requireRole('admin'), (req, res) => controller.getById(req, res))

router.post('/', requireRole('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('slug').trim().matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase letters, numbers, or hyphens'),
  validate,
], (req, res) => controller.create(req, res))

router.put('/:id', requireRole('admin'), (req, res) => controller.update(req, res))

router.patch('/:id/toggle', requireRole('admin'), (req, res) => controller.toggle(req, res))

router.delete('/:id', requireRole('admin'), (req, res) => controller.remove(req, res))

module.exports = router
