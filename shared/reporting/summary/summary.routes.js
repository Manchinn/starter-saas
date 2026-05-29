const { Router } = require('express')
const controller = require('./summary.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')

const router = Router()

router.use(authenticate)

// Gated on the ERP read permission — the ERP Summary visualizes the same data
// as the ERP dashboard, so visibility tracks the ERP module.
router.get('/erp', requirePermission('erp.products.list'), (req, res) => controller.erp(req, res))

module.exports = { mountPath: '/summary', router }
