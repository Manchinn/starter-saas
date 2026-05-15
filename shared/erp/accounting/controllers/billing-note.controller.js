const svc = require('../services/billing-note.service')

const list = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    res.json({ data: await svc.list({ page: +page || 1, limit: +limit || 20, search, status, organizationId }) })
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    res.json({ data: { billingNote: await svc.getById(req.params.id) } })
  } catch (err) { next(err) }
}

const availableInvoices = async (req, res, next) => {
  try {
    const { customerId } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    if (!customerId) return res.json({ data: { invoices: [] } })
    const invoices = await svc.availableInvoices({ customerId, organizationId })
    res.json({ data: { invoices } })
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    const doc = await svc.create({ ...req.body, userId, organizationId })
    res.status(201).json({ data: { billingNote: doc } })
  } catch (err) { next(err) }
}

const send = async (req, res, next) => {
  try {
    res.json({ data: { billingNote: await svc.send(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const markPaid = async (req, res, next) => {
  try {
    res.json({ data: { billingNote: await svc.markPaid(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const cancel = async (req, res, next) => {
  try {
    res.json({ data: { billingNote: await svc.cancel(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id)
    res.json({ data: { message: 'Deleted' } })
  } catch (err) { next(err) }
}

module.exports = { list, getById, availableInvoices, create, send, markPaid, cancel, remove }
