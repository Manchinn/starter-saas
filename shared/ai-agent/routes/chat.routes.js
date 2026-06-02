const { Router } = require('express')
const controller = require('../controllers/chat.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')
const { chatRules } = require('../validators/ai.validators')

const router = Router()

router.use(authenticate)

router.post('/',               requirePermission('ai-agent.use'), chatRules, validate, (req, res) => controller.send(req, res))
router.get('/conversations',   requirePermission('ai-agent.use'), (req, res) => controller.conversations(req, res))
router.delete('/conversations',     requirePermission('ai-agent.use'), (req, res) => controller.removeAll(req, res))
router.get('/conversations/:id',    requirePermission('ai-agent.use'), (req, res) => controller.conversation(req, res))
router.delete('/conversations/:id', requirePermission('ai-agent.use'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/chat', router }
