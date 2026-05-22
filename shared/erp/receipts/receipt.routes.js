const { Router } = require('express')
const controller = require('./receipt.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')
const { createRules, statusRules } = require('./receipt.validators')

const router = Router()
router.use(authenticate)

router.get('/',             requirePermission('erp.receipts.list'),   (req, res) => controller.list(req, res))
router.get('/:id',          requirePermission('erp.receipts.list'),   (req, res) => controller.getById(req, res))
router.post('/',            requirePermission('erp.receipts.edit'),   createRules, validate, (req, res) => controller.create(req, res))
router.put('/:id',          requirePermission('erp.receipts.edit'),   (req, res) => controller.update(req, res))
router.patch('/:id/status', requirePermission('erp.receipts.edit'),   statusRules, validate, (req, res) => controller.updateStatus(req, res))
router.delete('/:id',       requirePermission('erp.receipts.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/receipts', router }
