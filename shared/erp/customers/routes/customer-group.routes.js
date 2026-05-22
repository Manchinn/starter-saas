const { Router } = require('express')
const controller = require('../controllers/customer-group.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { validate } = require('../../../../server/middleware/validate')
const { writeRules } = require('../validators/customer-group.validators')

const router = Router()

router.use(authenticate)

router.get('/all',   requirePermission('erp.customers.list'),         (req, res) => controller.listAll(req, res))
router.get('/',      requirePermission('erp.customer-groups.list'),   (req, res) => controller.list(req, res))
router.get('/:id',   requirePermission('erp.customer-groups.list'),   (req, res) => controller.getById(req, res))
router.post('/',     requirePermission('erp.customer-groups.edit'),   writeRules, validate, (req, res) => controller.create(req, res))
router.put('/:id',   requirePermission('erp.customer-groups.edit'),   writeRules, validate, (req, res) => controller.update(req, res))
router.delete('/:id',requirePermission('erp.customer-groups.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/customer-groups', router }
