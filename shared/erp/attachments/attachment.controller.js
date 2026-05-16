const fs = require('fs')
const svc = require('./attachment.service')

const list = async (req, res, next) => {
  try {
    const { refType, refId } = req.query
    const orgId = req.user?.organizationId || req.user?.id
    res.json({ data: { attachments: await svc.list({ refType, refId, organizationId: orgId }) } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const orgId = req.user?.organizationId || req.user?.id
    const att = await svc.create({ ...req.body, userId: req.user?.id, organizationId: orgId })
    res.status(201).json({ data: { attachment: att } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

const download = async (req, res, next) => {
  try {
    const att = await svc.getById(req.params.id)
    const { path, mimeType, filename } = svc.streamFile(att)
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    fs.createReadStream(path).pipe(res)
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

module.exports = { list, create, download, remove }
