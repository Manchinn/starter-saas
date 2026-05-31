const { Router } = require('express')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/financial-statements.controller')

const router = Router()
router.use(authenticate)

router.get('/balance-sheet',     requirePermission('erp.accounting.list'), controller.balanceSheet)
router.get('/income-statement',  requirePermission('erp.accounting.list'), controller.incomeStatement)
router.get('/changes-in-equity', requirePermission('erp.accounting.list'), controller.changesInEquity)
router.get('/notes',             requirePermission('erp.accounting.list'), controller.notes)

module.exports = { mountPath: '/accounting/financial-statements', router }
