const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/vendor-bill.controller')
const { writeRules, statusRules } = require('../validators/vendor-bill.validators')

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests — please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many write requests — please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
})

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
