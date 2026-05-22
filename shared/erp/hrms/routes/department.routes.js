const { Router } = require('express')
const controller = require('../controllers/department.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { validate } = require('../../../../server/middleware/validate')
const { writeRules } = require('../validators/department.validators')

const router = Router()
router.use(authenticate)

router.get('/', (req, res) => controller.list(req, res))
router.get('/:id', (req, res) => controller.getById(req, res))

router.post('/', writeRules, validate, (req, res) => controller.create(req, res))

router.put('/:id', writeRules, validate, (req, res) => controller.update(req, res))

router.delete('/:id', (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/hrms/departments', router }
