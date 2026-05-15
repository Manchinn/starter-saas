const svc = require('./delivery-order.service')

const list = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    res.json({ data: await svc.list({ page: +page || 1, limit: +limit || 20, search, status, organizationId }) })
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    res.json({ data: { deliveryOrder: await svc.getById(req.params.id) } })
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    const doc = await svc.create({ ...req.body, userId, organizationId })
    res.status(201).json({ data: { deliveryOrder: doc } })
  } catch (err) { next(err) }
}

const confirm = async (req, res, next) => {
  try {
    res.json({ data: { deliveryOrder: await svc.confirm(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const ship = async (req, res, next) => {
  try {
    res.json({ data: { deliveryOrder: await svc.ship(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const deliver = async (req, res, next) => {
  try {
    res.json({ data: { deliveryOrder: await svc.deliver(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const cancel = async (req, res, next) => {
  try {
    res.json({ data: { deliveryOrder: await svc.cancel(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id)
    res.json({ data: { message: 'Deleted' } })
  } catch (err) { next(err) }
}

const createInvoice = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    res.status(201).json({ data: await svc.createInvoice(req.params.id, userId, organizationId) })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

module.exports = { list, getById, create, confirm, ship, deliver, cancel, remove, createInvoice }
