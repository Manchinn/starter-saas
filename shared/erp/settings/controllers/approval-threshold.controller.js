const svc = require('../services/approval-threshold.service')

const list = async (req, res, next) => {
  try {
    const orgId = req.user?.organizationId || req.user?.id
    const { docType } = req.query
    res.json({ data: { thresholds: await svc.list({ docType, organizationId: orgId }) } })
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    res.json({ data: { threshold: await svc.getById(req.params.id) } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const orgId  = req.user?.organizationId || req.user?.id
    const userId = req.user?.id
    res.status(201).json({ data: { threshold: await svc.create({ ...req.body, userId, organizationId: orgId }) } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    res.json({ data: { threshold: await svc.update(req.params.id, req.body, req.user?.id) } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id)
    res.json({ data: { message: 'Deleted' } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

module.exports = { list, getById, create, update, remove }
