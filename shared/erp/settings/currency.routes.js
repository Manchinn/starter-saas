const { Router } = require('express')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')
const c = require('./currency.controller')

const router = Router()
router.use(authenticate)

router.get('/',                   requirePermission('erp.currencies.list'), c.listCurrencies)
router.post('/',                  requirePermission('erp.currencies.edit'), c.createCurrency)
router.put('/:id',                requirePermission('erp.currencies.edit'), c.updateCurrency)
router.delete('/:id',             requirePermission('erp.currencies.edit'), c.removeCurrency)

router.get('/rates/all',          requirePermission('erp.currencies.list'), c.listRates)
router.post('/rates',             requirePermission('erp.currencies.edit'), c.createRate)
router.delete('/rates/:id',       requirePermission('erp.currencies.edit'), c.removeRate)

module.exports = router
