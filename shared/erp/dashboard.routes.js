const { Router } = require('express')
const controller = require('./dashboard.controller')
const { authenticate } = require('../../server/middleware/auth')
const { requirePermission } = require('../../server/middleware/permission')

const router = Router()

router.use(authenticate)

router.get('/stats', requirePermission('erp.products.list'), (req, res) => controller.stats(req, res))

module.exports = router
