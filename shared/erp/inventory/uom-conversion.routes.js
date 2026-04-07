const express = require('express')
const router = express.Router()
const svc = require('./uom-conversion.service')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')

router.use(authenticate)

const wrap = fn => (req, res, next) => fn(req, res, next).catch(next)

router.get('/', requirePermission('erp.uom.list'), wrap(async (req, res) => {
  const conversions = await svc.list({ createdBy: req.user.id })
  res.json({ data: { conversions } })
}))

router.post('/', requirePermission('erp.uom.edit'), wrap(async (req, res) => {
  const conv = await svc.create({ ...req.body, createdBy: req.user.id })
  res.status(201).json({ data: { conversion: conv } })
}))

router.put('/:id', requirePermission('erp.uom.edit'), wrap(async (req, res) => {
  const conv = await svc.update(req.params.id, req.body)
  res.json({ data: { conversion: conv } })
}))

router.delete('/:id', requirePermission('erp.uom.delete'), wrap(async (req, res) => {
  await svc.remove(req.params.id)
  res.json({ message: 'Deleted' })
}))

module.exports = router
