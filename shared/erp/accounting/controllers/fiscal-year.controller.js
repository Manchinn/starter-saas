const svc = require('../services/fiscal-year.service')

const list = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    res.json({ data: await svc.list({ page: +page || 1, limit: +limit || 20, search, status, organizationId }) })
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId || req.user?.id
    res.json({ data: { fiscalYear: await svc.getById(req.params.id, organizationId) } })
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    const doc = await svc.create({ ...req.body, userId, organizationId })
    res.status(201).json({ data: { fiscalYear: doc } })
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId || req.user?.id
    const doc = await svc.update(req.params.id, { ...req.body, userId: req.user?.id }, organizationId)
    res.json({ data: { fiscalYear: doc } })
  } catch (err) { next(err) }
}

const close = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId || req.user?.id
    res.json({ data: { fiscalYear: await svc.close(req.params.id, req.user?.id, organizationId) } })
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId || req.user?.id
    await svc.remove(req.params.id, organizationId)
    res.json({ data: { message: 'Deleted' } })
  } catch (err) { next(err) }
}

module.exports = { list, getById, create, update, close, remove }
