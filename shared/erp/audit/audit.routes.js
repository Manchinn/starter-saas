const { Router } = require('express')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const controller = require('./audit.controller')

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('erp.audit.list'), controller.list)

module.exports = router
