const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/vendor-bill.controller')

const router = Router()
router.use(authenticate)

router.get('/',                requirePermission('erp.bills.list'),   controller.list)
router.get('/:id',             requirePermission('erp.bills.list'),   controller.getById)
router.post('/',               requirePermission('erp.bills.edit'),
  [body('items').isArray({ min: 1 }).withMessage('At least one item is required'), validate],
  controller.create)
router.put('/:id',             requirePermission('erp.bills.edit'),
  [body('items').isArray({ min: 1 }).withMessage('At least one item is required'), validate],
  controller.update)
router.patch('/:id/status',    requirePermission('erp.bills.edit'),
  [body('status').isIn(['draft', 'approved', 'paid', 'cancelled']).withMessage('Invalid status'), validate],
  controller.updateStatus)
router.delete('/:id',          requirePermission('erp.bills.delete'), controller.remove)

module.exports = { mountPath: '/purchasing/bills', router }