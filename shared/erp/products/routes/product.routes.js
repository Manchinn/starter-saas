const { Router } = require('express')
const controller = require('../controllers/product.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { validate } = require('../../../../server/middleware/validate')
const { writeRules } = require('../validators/product.validators')

const router = Router()

router.use(authenticate)

router.get('/stores-lookup',        (req, res) => controller.listStores(req, res))
router.get('/:id/store-stocks',     (req, res) => controller.listStoreStocks(req, res))
router.get('/',       (req, res) => controller.list(req, res))
router.get('/:id',    (req, res) => controller.getById(req, res))
router.post('/',      writeRules, validate, (req, res) => controller.create(req, res))
router.put('/:id',    writeRules, validate, (req, res) => controller.update(req, res))
router.delete('/:id', (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/item-master', router }
