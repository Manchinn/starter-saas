const { Router } = require('express')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { apiLimiter, writeLimiter } = require('../../../../server/middleware/rate-limit')
const controller = require('../controllers/vendor-bill.controller')
const { writeRules, statusRules } = require('../validators/vendor-bill.validators')

const router = Router()
router.use(apiLimiter)
router.use(authenticate)

router.get('/',                requirePermission('erp.bills.list'),   controller.list)
router.get('/:id',             requirePermission('erp.bills.list'),   controller.getById)
router.post('/',               requirePermission('erp.bills.edit'),   writeLimiter, writeRules, validate, controller.create)
router.put('/:id',             requirePermission('erp.bills.edit'),   writeLimiter, writeRules, validate, controller.update)
router.patch('/:id/status',    requirePermission('erp.bills.edit'),   writeLimiter, statusRules, validate, controller.updateStatus)
router.delete('/:id',          requirePermission('erp.bills.delete'), writeLimiter, controller.remove)

module.exports = { mountPath: '/purchasing/bills', router }
