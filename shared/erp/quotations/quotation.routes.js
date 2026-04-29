const { Router } = require('express')
const controller = require('./quotation.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')

const router = Router()
router.use(authenticate)

router.get('/',              requirePermission('erp.quotations.list'),   (req, res) => controller.list(req, res))
router.get('/:id',           requirePermission('erp.quotations.list'),   (req, res) => controller.getById(req, res))
router.post('/',             requirePermission('erp.quotations.edit'),   (req, res) => controller.create(req, res))
router.put('/:id',           requirePermission('erp.quotations.edit'),   (req, res) => controller.update(req, res))
router.patch('/:id/status',  requirePermission('erp.quotations.edit'),   (req, res) => controller.updateStatus(req, res))
router.post('/:id/convert',  requirePermission('erp.quotations.edit'),   (req, res) => controller.convertToOrder(req, res))
router.delete('/:id',        requirePermission('erp.quotations.delete'), (req, res) => controller.remove(req, res))

module.exports = router
