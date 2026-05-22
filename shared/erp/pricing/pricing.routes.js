const { Router } = require('express')
const controller = require('./pricing.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')
const { createRules, updateRules } = require('./pricing.validators')

const router = Router()

router.use(authenticate)

router.get('/', requirePermission('erp.pricing.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('erp.pricing.list'), (req, res) => controller.getById(req, res))

router.post('/', requirePermission('erp.pricing.manage'), createRules, validate, (req, res) => controller.create(req, res))

router.put('/:id', requirePermission('erp.pricing.manage'), updateRules, validate, (req, res) => controller.update(req, res))

router.delete('/:id', requirePermission('erp.pricing.manage'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/pricing', router }
