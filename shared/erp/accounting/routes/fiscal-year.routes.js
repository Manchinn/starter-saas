const { Router } = require('express')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/fiscal-year.controller')
const { createRules } = require('../validators/fiscal-year.validators')

const router = Router()
router.use(authenticate)

router.get('/',           requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',        requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',          requirePermission('erp.accounting.edit'),   createRules, validate, controller.create)
router.put('/:id',        requirePermission('erp.accounting.edit'),   controller.update)
router.post('/:id/close', requirePermission('erp.accounting.edit'),   controller.close)
router.delete('/:id',     requirePermission('erp.accounting.delete'), controller.remove)

module.exports = { mountPath: '/accounting/fiscal-years', router }
