const { Router } = require('express')
const controller = require('./dashboard.controller')
const { authenticate } = require('../../middleware/auth')

const router = Router()

router.use(authenticate)
router.get('/stats',            (req, res) => controller.stats(req, res))
router.get('/organizations',    (req, res) => controller.organizations(req, res))
router.get('/recent-sign-ins',  (req, res) => controller.recentSignIns(req, res))
router.get('/module-usage',     (req, res) => controller.moduleUsage(req, res))

module.exports = router
