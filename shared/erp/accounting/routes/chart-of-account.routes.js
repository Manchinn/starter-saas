const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('../controllers/chart-of-account.controller')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const { validate } = require('../../../../server/middleware/validate')

const router = Router()

router.use(authenticate)

const validation = [
  body('code').trim().notEmpty().withMessage('Account code is required'),
  body('name').trim().notEmpty().withMessage('Account name is required'),
  body('accountType').trim().notEmpty().withMessage('Account type is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  validate,
]

router.get('/all',   requirePermission('erp.accounting.list'),   (req, res) => controller.listAll(req, res))
router.get('/',      requirePermission('erp.accounting.list'),   (req, res) => controller.list(req, res))
router.get('/:id',   requirePermission('erp.accounting.list'),   (req, res) => controller.getById(req, res))
router.post('/',     requirePermission('erp.accounting.edit'),   validation, (req, res) => controller.create(req, res))
router.put('/:id',   requirePermission('erp.accounting.edit'),   validation, (req, res) => controller.update(req, res))
router.delete('/:id',requirePermission('erp.accounting.delete'), (req, res) => controller.remove(req, res))

module.exports = { mountPath: '/accounting/chart-of-accounts', router }