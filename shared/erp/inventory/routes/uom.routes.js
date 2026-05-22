const { Router } = require('express')
const controller = require('../controllers/uom.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { validate } = require('../../../../server/middleware/validate')
const { writeRules } = require('../validators/uom.validators')

const router = Router()

router.use(authenticate)

router.get('/',       requirePermission('erp.uom.list'),   (req, res) => controller.list(req, res))
router.get('/:id',    requirePermission('erp.uom.list'),   (req, res) => controller.getById(req, res))
router.post('/',      requirePermission('erp.uom.edit'),   writeRules, validate, (req, res) => controller.create(req, res))
router.put('/:id',    requirePermission('erp.uom.edit'),   writeRules, validate, (req, res) => controller.update(req, res))
router.delete('/:id', requirePermission('erp.uom.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/uom', router }
