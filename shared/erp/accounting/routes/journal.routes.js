const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/journal.controller')

const router = Router()
router.use(authenticate)

const lineRules = [
  body('lines').isArray({ min: 2 }).withMessage('At least 2 lines are required'),
  body('lines.*.accountId').notEmpty().withMessage('Each line must have an account'),
]
const createRules = [
  body('date').notEmpty().withMessage('Date is required'),
  ...lineRules,
]

router.get('/',                requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',             requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',               requirePermission('erp.accounting.edit'),   createRules, validate, controller.create)
router.put('/:id',             requirePermission('erp.accounting.edit'),   createRules, validate, controller.update)
router.post('/:id/post',       requirePermission('erp.accounting.edit'),   controller.post)
router.post('/:id/void',       requirePermission('erp.accounting.edit'),   controller.voidJournal)
router.delete('/:id',          requirePermission('erp.accounting.delete'), controller.remove)

module.exports = { mountPath: '/accounting/journals', router }