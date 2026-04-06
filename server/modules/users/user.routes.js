const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./user.controller')
const { authenticate } = require('../../middleware/auth')
const { requirePermission } = require('../../middleware/permission')
const { validate } = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

// Self — any authenticated user
router.get('/my-modules', (req, res) => controller.myModules(req, res))
router.get('/my-permissions', (req, res) => controller.myPermissions(req, res))

// Permission-guarded
router.post('/', requirePermission('users.edit'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Role must be admin or user'),
  validate,
], (req, res) => controller.create(req, res))

router.get('/', requirePermission('users.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('users.list'), (req, res) => controller.getById(req, res))
router.put('/:id', requirePermission('users.edit'), (req, res) => controller.update(req, res))
router.delete('/:id', requirePermission('users.delete'), (req, res) => controller.remove(req, res))
router.put('/:id/modules', requirePermission('users.edit'), (req, res) => controller.assignModules(req, res))
router.put('/:id/roles', requirePermission('users.edit'), (req, res) => controller.assignRoles(req, res))

module.exports = router
