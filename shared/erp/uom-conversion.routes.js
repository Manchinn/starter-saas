const express = require('express')
const router = express.Router()
const svc = require('./uom-conversion.service')

const wrap = fn => (req, res, next) => fn(req, res, next).catch(next)

router.get('/', wrap(async (req, res) => {
  const conversions = await svc.list()
  res.json({ data: { conversions } })
}))

router.post('/', wrap(async (req, res) => {
  const conv = await svc.create(req.body)
  res.status(201).json({ data: { conversion: conv } })
}))

router.put('/:id', wrap(async (req, res) => {
  const conv = await svc.update(req.params.id, req.body)
  res.json({ data: { conversion: conv } })
}))

router.delete('/:id', wrap(async (req, res) => {
  await svc.remove(req.params.id)
  res.json({ message: 'Deleted' })
}))

module.exports = router
