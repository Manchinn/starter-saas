const { Router } = require('express')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const c = require('../controllers/tax-period.controller')

const router = Router()
router.use(authenticate)

router.get('/',             requirePermission('erp.tax-periods.list'), c.list)
router.get('/:id',          requirePermission('erp.tax-periods.list'), c.getById)
router.get('/:id/vat-report', requirePermission('erp.tax-periods.list'), c.vatReport)
router.post('/',            requirePermission('erp.tax-periods.edit'), c.create)
router.put('/:id',          requirePermission('erp.tax-periods.edit'), c.update)
router.post('/:id/close',   requirePermission('erp.tax-periods.edit'), c.close)
router.post('/:id/reopen',  requirePermission('erp.tax-periods.edit'), c.reopen)
router.delete('/:id',       requirePermission('erp.tax-periods.edit'), c.remove)

module.exports = router
