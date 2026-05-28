const { Router } = require('express')
const controller = require('../controllers/employee.controller')
const { authenticate } = require('../../../server/middleware/auth')

const router = Router()
router.use(authenticate)

router.get('/',     (req, res) => controller.list(req, res))
router.get('/:id',  (req, res) => controller.getById(req, res))
router.post('/',    (req, res) => controller.create(req, res))
router.put('/:id',  (req, res) => controller.update(req, res))
router.delete('/:id', (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/employees', router }