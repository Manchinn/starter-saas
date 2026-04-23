const express = require('express')
const router = express.Router()
const svc = require('./vendor.service')
const { authenticate } = require('../../../server/middleware/auth')

router.use(authenticate)

const wrap = fn => (req, res, next) => fn(req, res, next).catch(next)

router.get('/all', wrap(async (req, res) => {
  const vendors = await svc.listAll(req.user?.id)
  res.json({ data: { vendors } })
}))

router.get('/', wrap(async (req, res) => {
  const { page = 1, limit = 20, search = '', status = '', typeFilter = '' } = req.query
  const result = await svc.list({ page: +page, limit: +limit, search, status, typeFilter, createdBy: req.user?.id })
  res.json({ data: result })
}))

router.get('/:id', wrap(async (req, res) => {
  const vendor = await svc.getById(req.params.id)
  res.json({ data: { vendor } })
}))

router.post('/', wrap(async (req, res) => {
  const vendor = await svc.create({ ...req.body, userId: req.user?.id })
  res.status(201).json({ data: { vendor } })
}))

router.put('/:id', wrap(async (req, res) => {
  const vendor = await svc.update(req.params.id, req.body, req.user?.id)
  res.json({ data: { vendor } })
}))

router.delete('/:id', wrap(async (req, res) => {
  await svc.remove(req.params.id)
  res.json({ message: 'Deleted' })
}))

module.exports = router
