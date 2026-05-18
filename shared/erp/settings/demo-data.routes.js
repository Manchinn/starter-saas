const { Router } = require('express')
const controller = require('./demo-data.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requireRole } = require('../../../server/middleware/role')

const router = Router()
router.use(authenticate)
router.use(requireRole('admin'))

router.post('/seed',            (req, res) => controller.seed(req, res))
router.post('/seed-sequences', (req, res) => controller.seedSequences(req, res))
router.post('/reset',          (req, res) => controller.reset(req, res))

module.exports = router
