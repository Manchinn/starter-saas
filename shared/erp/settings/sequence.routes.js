const { Router } = require('express')
const controller = require('./sequence.controller')
const svc = require('./sequence.service')
const { authenticate } = require('../../../server/middleware/auth')
const { requireRole } = require('../../../server/middleware/role')

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

router.get('/',             (req, res) => controller.list(req, res))
router.get('/:id',          (req, res) => controller.getById(req, res))
router.post('/',            (req, res) => controller.create(req, res))
router.put('/:id',          (req, res) => controller.update(req, res))
router.post('/:id/reset',   (req, res) => controller.reset(req, res))
router.delete('/:id',       (req, res) => controller.remove(req, res))

module.exports = router
