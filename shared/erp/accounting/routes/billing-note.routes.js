const { Router } = require('express')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/billing-note.controller')
const { createRules } = require('../validators/billing-note.validators')

const router = Router()
router.use(authenticate)

router.get('/available-invoices',  requirePermission('erp.accounting.list'),   controller.availableInvoices)
router.get('/',                    requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',                 requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',                   requirePermission('erp.accounting.edit'),   createRules, validate, controller.create)
router.post('/:id/send',           requirePermission('erp.accounting.edit'),   controller.send)
router.post('/:id/pay',            requirePermission('erp.accounting.edit'),   controller.markPaid)
router.post('/:id/cancel',         requirePermission('erp.accounting.edit'),   controller.cancel)
router.delete('/:id',              requirePermission('erp.accounting.delete'), controller.remove)

module.exports = { mountPath: '/billing/billing-notes', router }
