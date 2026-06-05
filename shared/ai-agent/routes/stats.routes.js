const { Router } = require('express')
const controller = require('../controllers/stats.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')

const router = Router()

router.use(authenticate)

router.get('/tokens', requirePermission('ai-agent.use'), (req, res) => controller.tokens(req, res))

module.exports = { mountPath: '/stats', router }
