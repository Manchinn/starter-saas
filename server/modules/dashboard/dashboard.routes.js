const { Router } = require('express')
const controller = require('./dashboard.controller')
const { authenticate } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)
router.get('/stats', (req, res) => controller.stats(req, res))

module.exports = router
