const { Router } = require('express')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/cash-flow.controller')

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('erp.accounting.list'), controller.getStatement)

module.exports = { mountPath: '/accounting/cash-flow', router }
