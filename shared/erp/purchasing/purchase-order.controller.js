const svc = require('./purchase-order.service')

const list = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    const result = await svc.list({ page: +page || 1, limit: +limit || 20, search, status, organizationId })
    res.json({ data: result })
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    const doc = await svc.getById(req.params.id)
    res.json({ data: { order: doc } })
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    const doc = await svc.create({ ...req.body, userId, organizationId })
    res.status(201).json({ data: { order: doc } })
  } catch (err) { next(err) }
}

const confirm = async (req, res, next) => {
  try {
    const doc = await svc.confirm(req.params.id, req.user?.id, req.user)
    res.json({ data: { order: doc } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const receive = async (req, res, next) => {
  try {
    const doc = await svc.receive(req.params.id, req.user?.id)
    res.json({ data: { order: doc } })
  } catch (err) { next(err) }
}

const cancel = async (req, res, next) => {
  try {
    const doc = await svc.cancel(req.params.id, req.user?.id)
    res.json({ data: { order: doc } })
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id)
    res.json({ data: { message: 'Deleted' } })
  } catch (err) { next(err) }
}

const createGoodReceive = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    res.status(201).json({ data: await svc.createGoodReceive(req.params.id, userId, organizationId, { storeId: req.body.storeId }) })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

module.exports = { list, getById, create, confirm, receive, cancel, remove, createGoodReceive }
