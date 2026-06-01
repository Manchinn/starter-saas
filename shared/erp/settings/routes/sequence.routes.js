const { Router } = require('express')
const controller = require('../controllers/sequence.controller')
const svc = require('../services/sequence.service')
const { authenticate } = require('../../../../server/middleware/auth')
const { requireRole } = require('../../../../server/middleware/role')
const { requirePermission } = require('../../../../server/middleware/permission')

const router = Router()
router.use(authenticate)

// Admin: seed default sequences for a specific user
router.post('/seed-defaults/:userId', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await svc.seedDefaultsForUser(req.params.userId)
    res.json({ data: result })
  } catch (err) { next(err) }
})

router.get('/preview/:code', async (req, res, next) => {
  try {
    const userId = req.user?.id || null
    const code = req.params.code.toUpperCase()
    const preview = await svc.getPreview(code, userId)
    res.json({ success: true, data: { preview } })
  } catch (err) { next(err) }
})

// /preview/:code stays authenticate-only — it's a cross-module utility used by
// every create form to show the next number. The sequence config CRUD below is
// the Settings page, gated by erp.settings.{view,manage}.
router.get('/',             requirePermission('erp.settings.view'),   (req, res) => controller.list(req, res))
router.get('/:id',          requirePermission('erp.settings.view'),   (req, res) => controller.getById(req, res))
router.post('/',            requirePermission('erp.settings.manage'), (req, res) => controller.create(req, res))
router.put('/:id',          requirePermission('erp.settings.manage'), (req, res) => controller.update(req, res))
router.post('/:id/reset',   requirePermission('erp.settings.manage'), (req, res) => controller.reset(req, res))
router.delete('/:id',       requirePermission('erp.settings.manage'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/sequences', router }