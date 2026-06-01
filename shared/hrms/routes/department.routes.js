const { Router } = require('express')
const controller = require('../controllers/department.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')
const { writeRules } = require('../validators/department.validators')

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('hrms.departments.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('hrms.departments.list'), (req, res) => controller.getById(req, res))

router.post('/', requirePermission('hrms.departments.edit'), writeRules, validate, (req, res) => controller.create(req, res))

router.put('/:id', requirePermission('hrms.departments.edit'), writeRules, validate, (req, res) => controller.update(req, res))

router.delete('/:id', requirePermission('hrms.departments.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/departments', router }
