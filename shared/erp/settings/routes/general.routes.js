const { Router } = require('express')
const { authenticate } = require('../../../../server/middleware/auth')
const service = require('../services/general.service')

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const data = await service.get(req.user?.id)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load settings' })
  }
})

router.put('/', async (req, res) => {
  try {
    const data = await service.save(req.user?.id, req.body)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save settings' })
  }
})

module.exports = { mountPath: '/settings/general', router }