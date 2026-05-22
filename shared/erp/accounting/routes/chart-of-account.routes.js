const { Router } = require('express')
const controller = require('../controllers/chart-of-account.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { validate } = require('../../../../server/middleware/validate')
const { writeRules } = require('../validators/chart-of-account.validators')

const router = Router()

router.use(authenticate)

router.get('/all',   requirePermission('erp.accounting.list'),   (req, res) => controller.listAll(req, res))
router.get('/',      requirePermission('erp.accounting.list'),   (req, res) => controller.list(req, res))
router.get('/:id',   requirePermission('erp.accounting.list'),   (req, res) => controller.getById(req, res))
router.post('/',     requirePermission('erp.accounting.edit'),   writeRules, validate, (req, res) => controller.create(req, res))
router.put('/:id',   requirePermission('erp.accounting.edit'),   writeRules, validate, (req, res) => controller.update(req, res))
router.delete('/:id',requirePermission('erp.accounting.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/accounting/chart-of-accounts', router }
