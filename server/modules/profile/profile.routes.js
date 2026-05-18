const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./profile.controller')
const { authenticate } = require('../../middleware/auth')
const { validate } = require('../../middleware/validate')

const router = Router()

router.use(authenticate)

router.get('/', (req, res) => controller.getProfile(req, res))

router.put('/', [
  body('name').optional().isString().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  validate,
], (req, res) => controller.updateProfile(req, res))

router.get('/sessions', (req, res) => controller.listSessions(req, res))
router.delete('/sessions', (req, res) => controller.revokeAllOtherSessions(req, res))
router.delete('/sessions/:id', (req, res) => controller.revokeSession(req, res))

module.exports = router
