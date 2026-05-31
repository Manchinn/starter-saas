const { Router } = require('express')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/reports.controller')

const router = Router()
router.use(authenticate)

router.get('/trial-balance',  requirePermission('erp.accounting.list'), controller.trialBalance)
router.get('/general-ledger', requirePermission('erp.accounting.list'), controller.generalLedger)

module.exports = { mountPath: '/accounting/reports', router }
