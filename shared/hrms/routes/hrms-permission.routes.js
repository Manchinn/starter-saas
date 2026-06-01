const { Router } = require('express')
const controller = require('../controllers/hrms-permission.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')

const router = Router()
router.use(authenticate)

router.get('/', requirePermission('hrms.roles.list'), (req, res) => controller.list(req, res))

module.exports = { mountPath: '/permissions', router }
