const svc = require('../services/vendor-bill.service')

const list = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    res.json({ data: await svc.list({ page: +page || 1, limit: +limit || 20, search, status, organizationId }) })
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    res.json({ data: { bill: await svc.getById(req.params.id) } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    const bill = await svc.create({ ...req.body, userId, organizationId })
    res.status(201).json({ data: { bill } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const bill = await svc.update(req.params.id, { ...req.body, userId })
    res.json({ data: { bill } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    res.json({ data: { bill: await svc.updateStatus(req.params.id, req.body.status, req.user?.id, req.user) } })
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

module.exports = { list, getById, create, update, updateStatus, remove }
