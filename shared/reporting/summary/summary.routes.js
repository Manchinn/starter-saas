const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const controller = require('./summary.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests — please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const router = Router()

router.use(apiLimiter)
router.use(authenticate)

// Gated on the ERP read permission — the ERP Summary visualizes the same data
// as the ERP dashboard, so visibility tracks the ERP module.
router.get('/erp', requirePermission('erp.products.list'), (req, res) => controller.erp(req, res))

module.exports = { mountPath: '/summary', router }
