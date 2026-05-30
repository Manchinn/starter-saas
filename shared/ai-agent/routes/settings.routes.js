const { Router } = require('express')
const controller = require('../controllers/settings.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')
const { settingsRules } = require('../validators/ai.validators')

const router = Router()

router.use(authenticate)

router.get('/',        requirePermission('ai-agent.settings'), (req, res) => controller.get(req, res))
router.put('/',        requirePermission('ai-agent.settings'), settingsRules, validate, (req, res) => controller.update(req, res))
router.get('/models',  requirePermission('ai-agent.settings'), (req, res) => controller.models(req, res))

module.exports = { mountPath: '/settings', router }
