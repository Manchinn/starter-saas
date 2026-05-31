const { Router } = require('express')
const controller = require('../controllers/hrms-permission.controller')
const { authenticate } = require('../../../server/middleware/auth')

const router = Router()
router.use(authenticate)

router.get('/', (req, res) => controller.list(req, res))

module.exports = { mountPath: '/permissions', router }
