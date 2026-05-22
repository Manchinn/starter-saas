const { Router } = require('express')
const { validate } = require('../../../../server/middleware/validate')
const { authenticate } = require('../../../../server/middleware/auth')
const { requirePermission } = require('../../../../server/middleware/permission')
const controller = require('../controllers/journal.controller')
const { writeRules } = require('../validators/journal.validators')

const router = Router()
router.use(authenticate)

router.get('/',                requirePermission('erp.accounting.list'),   controller.list)
router.get('/:id',             requirePermission('erp.accounting.list'),   controller.getById)
router.post('/',               requirePermission('erp.accounting.edit'),   writeRules, validate, controller.create)
router.put('/:id',             requirePermission('erp.accounting.edit'),   writeRules, validate, controller.update)
router.post('/:id/post',       requirePermission('erp.accounting.edit'),   controller.post)
router.post('/:id/void',       requirePermission('erp.accounting.edit'),   controller.voidJournal)
router.delete('/:id',          requirePermission('erp.accounting.delete'), controller.remove)

module.exports = { mountPath: '/accounting/journals', router }
