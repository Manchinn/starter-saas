const { Router } = require('express')
const controller = require('../controllers/sale-package.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { validate } = require('../../../../server/middleware/validate')
const { createRules, updateRules } = require('../validators/sale-package.validators')

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('erp.sale-packages.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('erp.sale-packages.list'), (req, res) => controller.getById(req, res))

router.post('/', requirePermission('erp.sale-packages.manage'), createRules, validate, (req, res) => controller.create(req, res))

router.put('/:id', requirePermission('erp.sale-packages.manage'), updateRules, validate, (req, res) => controller.update(req, res))

router.delete('/:id', requirePermission('erp.sale-packages.manage'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/sale-packages', router }
