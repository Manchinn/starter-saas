const { Router } = require('express')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/approval-threshold.controller')
const { writeRules } = require('../validators/approval-threshold.validators')

const router = Router()
router.use(authenticate)

router.get('/',          requirePermission('erp.thresholds.list'),   controller.list)
router.get('/:id',       requirePermission('erp.thresholds.list'),   controller.getById)
router.post('/',         requirePermission('erp.thresholds.edit'),   writeRules, validate, controller.create)
router.put('/:id',       requirePermission('erp.thresholds.edit'),   writeRules, validate, controller.update)
router.delete('/:id',    requirePermission('erp.thresholds.edit'),   controller.remove)

module.exports = { mountPath: '/settings/approval-thresholds', router }
