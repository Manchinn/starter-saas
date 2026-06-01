const { Router } = require('express')
const controller = require('../controllers/employee.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')

const router = Router()
router.use(authenticate)

router.get('/',     requirePermission('hrms.employees.list'),   (req, res) => controller.list(req, res))
router.get('/:id',  requirePermission('hrms.employees.list'),   (req, res) => controller.getById(req, res))
router.post('/',    requirePermission('hrms.employees.edit'),   (req, res) => controller.create(req, res))
router.put('/:id',  requirePermission('hrms.employees.edit'),   (req, res) => controller.update(req, res))
router.delete('/:id', requirePermission('hrms.employees.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/employees', router }