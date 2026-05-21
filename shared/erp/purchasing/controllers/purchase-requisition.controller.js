const svc = require('../services/purchase-requisition.service')

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
    res.json({ data: { requisition: doc } })
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    const doc = await svc.create({ ...req.body, userId, organizationId })
    res.status(201).json({ data: { requisition: doc } })
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const doc = await svc.update(req.params.id, { ...req.body, userId })
    res.json({ data: { requisition: doc } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const approve = async (req, res, next) => {
  try {
    const doc = await svc.approve(req.params.id, req.user?.id)
    res.json({ data: { requisition: doc } })
  } catch (err) { next(err) }
}

const reject = async (req, res, next) => {
  try {
    const doc = await svc.reject(req.params.id, req.user?.id)
    res.json({ data: { requisition: doc } })
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id)
    res.json({ data: { message: 'Deleted' } })
  } catch (err) { next(err) }
}

const listOrders = async (req, res, next) => {
  try {
    const orders = await svc.listOrders(req.params.id)
    res.json({ data: { orders } })
  } catch (err) { next(err) }
}

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    res.status(201).json({ data: await svc.createOrder(req.params.id, userId, organizationId) })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const generateReorder = async (req, res, next) => {
  try {
    const orgId = req.user?.organizationId || req.user?.id
    res.status(201).json({ data: await svc.generateReorder({ userId: req.user?.id, organizationId: orgId }) })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

module.exports = { list, getById, create, update, approve, reject, remove, listOrders, createOrder, generateReorder }
