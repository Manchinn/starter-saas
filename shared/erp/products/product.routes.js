const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./product.controller')
const { authenticate } = require('../../../server/middleware/auth')
const { validate } = require('../../../server/middleware/validate')

const router = Router()

router.use(authenticate)

const validation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  validate,
]

router.get('/stores-lookup',        (req, res) => controller.listStores(req, res))
router.get('/:id/store-stocks',     (req, res) => controller.listStoreStocks(req, res))
router.get('/',       (req, res) => controller.list(req, res))
router.get('/:id',    (req, res) => controller.getById(req, res))
router.post('/',      validation, (req, res) => controller.create(req, res))
router.put('/:id',    validation, (req, res) => controller.update(req, res))
router.delete('/:id', (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/item-master', router }