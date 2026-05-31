const { Router } = require('express')
const controller = require('../controllers/hrms-role.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { validate } = require('../../../server/middleware/validate')
const { createRules } = require('../validators/hrms-role.validators')

const router = Router()
router.use(authenticate)

router.get('/',    (req, res) => controller.list(req, res))
router.get('/:id', (req, res) => controller.getById(req, res))

router.post('/', createRules, validate, (req, res) => controller.create(req, res))

router.put('/:id',             (req, res) => controller.update(req, res))
router.put('/:id/permissions', (req, res) => controller.assignPermissions(req, res))
router.delete('/:id',          (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/roles', router }
