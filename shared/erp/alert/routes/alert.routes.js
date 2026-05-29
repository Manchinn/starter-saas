const { Router } = require('express')
const controller = require('../controllers/alert.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { validate } = require('../../../../server/middleware/validate')
const { writeRules } = require('../validators/alert.validators')

const router = Router()

router.use(authenticate)

// ── Current-user bell feed (any user with list permission) ────────────────────
router.get('/feed',          requirePermission('erp.alerts.list'),   (req, res) => controller.feed(req, res))
router.get('/unread-count',  requirePermission('erp.alerts.list'),   (req, res) => controller.unreadCount(req, res))
router.post('/read-all',     requirePermission('erp.alerts.list'),   (req, res) => controller.markAllRead(req, res))
router.post('/:id/read',     requirePermission('erp.alerts.list'),   (req, res) => controller.markRead(req, res))

// ── Author form helpers ───────────────────────────────────────────────────────
router.get('/options',       requirePermission('erp.alerts.manage'), (req, res) => controller.options(req, res))

// ── Management CRUD ───────────────────────────────────────────────────────────
router.get('/',      requirePermission('erp.alerts.list'),   (req, res) => controller.list(req, res))
router.get('/:id',   requirePermission('erp.alerts.list'),   (req, res) => controller.getById(req, res))
router.post('/',     requirePermission('erp.alerts.manage'), writeRules, validate, (req, res) => controller.create(req, res))
router.put('/:id',   requirePermission('erp.alerts.manage'), writeRules, validate, (req, res) => controller.update(req, res))
router.delete('/:id',requirePermission('erp.alerts.manage'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/alerts', router }
