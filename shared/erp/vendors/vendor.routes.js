const express = require('express')
const router = express.Router()
const svc = require('./vendor.service')
const { authenticate } = require('../../../server/middleware/auth')
const { requirePermission } = require('../../../server/middleware/permission')

router.use(authenticate)

const wrap = fn => (req, res, next) => fn(req, res, next).catch(next)

router.get('/all', requirePermission('erp.vendors.list'), wrap(async (req, res) => {
  const orgId = req.user?.organizationId || req.user?.id
  const vendors = await svc.listAll(orgId)
  res.json({ data: { vendors } })
}))

router.get('/', requirePermission('erp.vendors.list'), wrap(async (req, res) => {
  const { page = 1, limit = 20, search = '', status = '', typeFilter = '', activeFrom = '', activeTo = '' } = req.query
  const orgId = req.user?.organizationId || req.user?.id
  const result = await svc.list({ page: +page, limit: +limit, search, status, typeFilter, activeFrom, activeTo, organizationId: orgId })
  res.json({ data: result })
}))

router.get('/:id', requirePermission('erp.vendors.list'), wrap(async (req, res) => {
  const orgId = req.user?.organizationId || req.user?.id
  const vendor = await svc.getById(req.params.id, orgId)
  res.json({ data: { vendor } })
}))

router.post('/', requirePermission('erp.vendors.edit'), wrap(async (req, res) => {
  const orgId = req.user?.organizationId || req.user?.id
  const vendor = await svc.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
  res.status(201).json({ data: { vendor } })
}))

router.put('/:id', requirePermission('erp.vendors.edit'), wrap(async (req, res) => {
  const orgId = req.user?.organizationId || req.user?.id
  const vendor = await svc.update(req.params.id, req.body, req.user?.id, orgId)
  res.json({ data: { vendor } })
}))

router.delete('/:id', requirePermission('erp.vendors.delete'), wrap(async (req, res) => {
  const orgId = req.user?.organizationId || req.user?.id
  await svc.remove(req.params.id, orgId)
  res.json({ message: 'Deleted' })
}))

module.exports = { mountPath: '/vendors', router }