const { Router } = require('express')
const controller = require('../controllers/hrms-role.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const { validate } = require('../../../server/middleware/validate')
const { createRules } = require('../validators/hrms-role.validators')

const router = Router()
router.use(authenticate)

router.get('/',    requirePermission('hrms.roles.list'), (req, res) => controller.list(req, res))
router.get('/:id', requirePermission('hrms.roles.list'), (req, res) => controller.getById(req, res))

router.post('/', requirePermission('hrms.roles.manage'), createRules, validate, (req, res) => controller.create(req, res))

router.put('/:id',             requirePermission('hrms.roles.manage'), (req, res) => controller.update(req, res))
router.put('/:id/permissions', requirePermission('hrms.roles.manage'), (req, res) => controller.assignPermissions(req, res))
router.delete('/:id',          requirePermission('hrms.roles.manage'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/roles', router }
