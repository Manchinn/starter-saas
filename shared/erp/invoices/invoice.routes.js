const { Router } = require('express')
const controller = require('./invoice.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')
// Plan-limit enforcement + usage metering. This route is the reference example
// of the pattern: gate the action with enforceLimit (so an over-quota request
// never runs) and count the successful result with meter (which only increments
// on a 2xx/3xx response). Copy this into any route that should be plan-limited.
const { enforceLimit, meter } = require('../../../server/middleware/plan')
const { itemsRules, statusRules } = require('./invoice.validators')

const router = Router()
router.use(authenticate)

router.get('/',                requirePermission('erp.invoices.list'),   (req, res) => controller.list(req, res))
router.get('/:id',             requirePermission('erp.invoices.list'),   (req, res) => controller.getById(req, res))
router.post('/',               requirePermission('erp.invoices.edit'),   enforceLimit('erp.invoices.monthly'), itemsRules, validate, meter('erp.invoices.monthly'), (req, res) => controller.create(req, res))
router.put('/:id',             requirePermission('erp.invoices.edit'),   (req, res) => controller.update(req, res))
router.patch('/:id/status',    requirePermission('erp.invoices.edit'),   statusRules, validate, (req, res) => controller.updateStatus(req, res))
router.post('/:id/create-receipt', requirePermission('erp.receipts.edit'), (req, res) => controller.createReceipt(req, res))
router.delete('/:id',          requirePermission('erp.invoices.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/invoices', router }
