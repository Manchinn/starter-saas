const { Router } = require('express')
const controller = require('./settings.controller')
const { authenticate } = require('../../middleware/auth')
const { requireRole } = require('../../middleware/role')
const { validate } = require('../../middleware/validate')
const { emailRules, testEmailRules } = require('./settings.validators')

const router = Router()

// Platform email configuration is admin-only.
router.use(authenticate, requireRole('admin'))

router.get('/email', (req, res) => controller.getEmail(req, res))
router.put('/email', emailRules, validate, (req, res) => controller.updateEmail(req, res))
router.post('/email/test-connection', (req, res) => controller.testConnection(req, res))
router.post('/email/test', testEmailRules, validate, (req, res) => controller.sendTest(req, res))

module.exports = router
