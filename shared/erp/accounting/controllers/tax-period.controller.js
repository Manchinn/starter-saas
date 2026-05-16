const svc = require('../services/tax-period.service')

const orgFrom = req => req.user?.organizationId || req.user?.id
const handleErr = (err, res, next) => {
  if (err.status) return res.status(err.status).json({ message: err.message })
  next(err)
}

const list = async (req, res, next) => {
  try { res.json({ data: { periods: await svc.list({ status: req.query.status, organizationId: orgFrom(req) }) } }) }
  catch (err) { handleErr(err, res, next) }
}

const getById = async (req, res, next) => {
  try { res.json({ data: { period: await svc.getById(req.params.id) } }) }
  catch (err) { handleErr(err, res, next) }
}

const create = async (req, res, next) => {
  try { res.status(201).json({ data: { period: await svc.create({ ...req.body, userId: req.user?.id, organizationId: orgFrom(req) }) } }) }
  catch (err) { handleErr(err, res, next) }
}

const update = async (req, res, next) => {
  try { res.json({ data: { period: await svc.update(req.params.id, req.body, req.user?.id) } }) }
  catch (err) { handleErr(err, res, next) }
}

const close = async (req, res, next) => {
  try { res.json({ data: { period: await svc.close(req.params.id, req.user?.id) } }) }
  catch (err) { handleErr(err, res, next) }
}

const reopen = async (req, res, next) => {
  try { res.json({ data: { period: await svc.reopen(req.params.id, req.user?.id) } }) }
  catch (err) { handleErr(err, res, next) }
}

const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); res.json({ data: { message: 'Deleted' } }) }
  catch (err) { handleErr(err, res, next) }
}

const vatReport = async (req, res, next) => {
  try { res.json({ data: await svc.getVatReport(req.params.id, orgFrom(req)) }) }
  catch (err) { handleErr(err, res, next) }
}

module.exports = { list, getById, create, update, close, reopen, remove, vatReport }
