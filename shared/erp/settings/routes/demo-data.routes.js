const { Router } = require('express')
const controller = require('../controllers/demo-data.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requireRole } = require('../../../../server/middleware/role')
const { requirePermission } = require('../../../../server/middleware/permission')

const router = Router()
router.use(authenticate)

// seed / seed-sequences are scoped to the caller's own org/user, so they are
// gated by the ERP settings permission (any ERP manager — incl. the Customer
// role — may populate their own data).
router.post('/seed',            requirePermission('erp.settings.manage'), (req, res) => controller.seed(req, res))
router.post('/seed-sequences', requirePermission('erp.settings.manage'), (req, res) => controller.seedSequences(req, res))
// reset wipes ALL ERP data across every tenant (unscoped destroy) — keep it
// restricted to system administrators.
router.post('/reset',          requireRole('admin'),                     (req, res) => controller.reset(req, res))

module.exports = { mountPath: '/settings/demo-data', router }