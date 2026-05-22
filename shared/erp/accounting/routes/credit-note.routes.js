const { Router } = require('express')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/credit-note.controller')
const { createRules } = require('../validators/credit-note.validators')

const router = Router()
router.use(authenticate)

// Static routes before /:id
router.get('/customer-invoices',   requirePermission('erp.accounting.list'),   controller.customerInvoices)
router.get('/',                    requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',                 requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',                   requirePermission('erp.accounting.edit'),   createRules, validate, controller.create)
router.post('/:id/issue',          requirePermission('erp.accounting.edit'),   controller.issue)
router.post('/:id/cancel',         requirePermission('erp.accounting.edit'),   controller.cancel)
router.delete('/:id',              requirePermission('erp.accounting.delete'), controller.remove)

module.exports = { mountPath: '/billing/credit-notes', router }
