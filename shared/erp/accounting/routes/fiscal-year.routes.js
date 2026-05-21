const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/fiscal-year.controller')

const router = Router()
router.use(authenticate)

const createRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('endDate').notEmpty().withMessage('End date is required'),
]

router.get('/',           requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',        requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',          requirePermission('erp.accounting.edit'),   createRules, validate, controller.create)
router.put('/:id',        requirePermission('erp.accounting.edit'),   controller.update)
router.post('/:id/close', requirePermission('erp.accounting.edit'),   controller.close)
router.delete('/:id',     requirePermission('erp.accounting.delete'), controller.remove)

module.exports = { mountPath: '/accounting/fiscal-years', router }