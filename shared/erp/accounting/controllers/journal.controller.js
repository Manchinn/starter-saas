const svc = require('../services/journal.service')

const list = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query
    const organizationId = req.user?.organizationId || req.user?.id
    res.json({ data: await svc.list({ page: +page || 1, limit: +limit || 20, search, status, organizationId }) })
  } catch (err) { next(err) }
}

const getById = async (req, res, next) => {
  try {
    res.json({ data: { journal: await svc.getById(req.params.id) } })
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const organizationId = req.user?.organizationId || req.user?.id
    const j = await svc.create({ ...req.body, userId, organizationId })
    res.status(201).json({ data: { journal: j } })
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const j = await svc.update(req.params.id, { ...req.body, userId })
    res.json({ data: { journal: j } })
  } catch (err) { next(err) }
}

const post = async (req, res, next) => {
  try {
    res.json({ data: { journal: await svc.post(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const voidJournal = async (req, res, next) => {
  try {
    res.json({ data: { journal: await svc.voidJournal(req.params.id, req.user?.id) } })
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id)
    res.json({ data: { message: 'Deleted' } })
  } catch (err) { next(err) }
}

module.exports = { list, getById, create, update, post, voidJournal, remove }
