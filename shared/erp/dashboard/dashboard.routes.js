const { Router } = require('express')
const controller = require('./dashboard.controller')
const { authenticate } = require('../../../server/middleware/auth')

const router = Router()

router.use(authenticate)

// No blanket permission guard: the dashboard is the default landing page for
// every logged-in employee. The service returns only the sections the caller's
// permissions allow (see dashboard.service.getStats), so an employee with no
// ERP grants simply gets an empty dashboard rather than a 403.
router.get('/stats', (req, res) => controller.stats(req, res))

module.exports = { mountPath: '/dashboard', router }