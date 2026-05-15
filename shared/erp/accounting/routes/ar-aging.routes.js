const { Router } = require('express')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/ar-aging.controller')

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('erp.accounting.list'), controller.getReport)

module.exports = router
