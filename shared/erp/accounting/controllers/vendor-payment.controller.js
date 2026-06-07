const svc = require('../services/vendor-payment.service')

const list = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    res.json({ data: await svc.list({ page: +page || 1, limit: +limit || 20, search, status, organizationId }) })
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    res.json({ data: { vendorPayment: await svc.getById(req.params.id) } })
  } catch (err) { next(err) }
}

const availableBills = async (req, res, next) => {
  try {
    const { vendorId } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    if (!vendorId) return res.json({ data: { bills: [] } })
    const bills = await svc.availableBills({ vendorId, organizationId })
    res.json({ data: { bills } })
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    const doc = await svc.create({ ...req.body, userId, organizationId })
    res.status(201).json({ data: { vendorPayment: doc } })
  } catch (err) { next(err) }
}

const confirm = async (req, res, next) => {
  try {
    res.json({ data: { vendorPayment: await svc.confirm(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const cancel = async (req, res, next) => {
  try {
    res.json({ data: { vendorPayment: await svc.cancel(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id)
    res.json({ data: { message: 'Deleted' } })
  } catch (err) { next(err) }
}

module.exports = { list, getById, availableBills, create, confirm, cancel, remove }
