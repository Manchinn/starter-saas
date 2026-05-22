const { Router } = require('express')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/receive-payment.controller')
const { createRules } = require('../validators/receive-payment.validators')

const router = Router()
router.use(authenticate)

// Static routes before /:id
router.get('/available-invoices', requirePermission('erp.accounting.list'),   controller.availableInvoices)
router.get('/',                   requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',                requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',                  requirePermission('erp.accounting.edit'),   createRules, validate, controller.create)
router.post('/:id/confirm',       requirePermission('erp.accounting.edit'),   controller.confirm)
router.post('/:id/cancel',        requirePermission('erp.accounting.edit'),   controller.cancel)
router.delete('/:id',             requirePermission('erp.accounting.delete'), controller.remove)

module.exports = { mountPath: '/billing/receive-payments', router }
