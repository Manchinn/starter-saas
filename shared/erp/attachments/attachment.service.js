const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { Attachment } = require('../../../server/models')
const { Op } = require('sequelize')

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
])

const STORAGE_ROOT = path.join(__dirname, '..', '..', '..', 'uploads', 'attachments')

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

const sanitizeName = (name) => String(name || 'file').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 200)

const buildStoredPath = (id) => {
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm   = String(now.getMonth() + 1).padStart(2, '0')
  const dir  = path.join(STORAGE_ROOT, yyyy, mm)
  ensureDir(dir)
  return path.join(dir, id)
}

const list = async ({ refType, refId, organizationId }) => {
  if (!refType || !refId) throw { status: 400, message: 'refType and refId are required' }
  return Attachment.findAll({
    where: {
      refType, refId,
      organizationId: organizationId || null,
      dataFlag: { [Op.ne]: 2 },
    },
    order: [['createdAt', 'DESC']],
  })
}

const getById = async (id) => {
  const att = await Attachment.findByPk(id)
  if (!att) throw { status: 404, message: 'Attachment not found' }
  return att
}

// Org-scoped lookup — used by download/remove so a user can only reach
// attachments belonging to their own organization. A mismatch is reported as
// 404 (not 403) so we don't confirm the existence of other orgs' files.
const getByIdScoped = async (id, organizationId) => {
  const att = await Attachment.findByPk(id)
  if (!att || String(att.organizationId) !== String(organizationId)) {
    throw { status: 404, message: 'Attachment not found' }
  }
  return att
}

const create = async ({ refType, refId, originalName, contentType, dataBase64, userId, organizationId }) => {
  if (!refType || !refId)   throw { status: 400, message: 'refType and refId are required' }
  if (!originalName)        throw { status: 400, message: 'File name is required' }
  if (!dataBase64)          throw { status: 400, message: 'File data is required' }
  if (!ALLOWED_MIME.has(contentType)) {
    throw { status: 400, message: `Unsupported file type "${contentType}"` }
  }

  // base64 may include a data URL prefix
  const cleaned = String(dataBase64).replace(/^data:[^;]+;base64,/, '')
  const buf = Buffer.from(cleaned, 'base64')
  if (buf.length > MAX_SIZE_BYTES) {
    throw { status: 400, message: `File exceeds maximum size of ${MAX_SIZE_BYTES / 1024 / 1024} MB` }
  }

  const id = crypto.randomUUID()
  const storedPath = buildStoredPath(id)
  fs.writeFileSync(storedPath, buf)

  return Attachment.create({
    id,
    refType,
    refId,
    originalName: sanitizeName(originalName),
    storedName:   path.relative(STORAGE_ROOT, storedPath),
    mimeType:     contentType,
    size:         buf.length,
    uploadedBy:   userId || null,
    organizationId: organizationId || null,
  })
}

const streamFile = (att) => {
  const fullPath = path.join(STORAGE_ROOT, att.storedName)
  if (!fs.existsSync(fullPath)) throw { status: 404, message: 'File missing on disk' }
  return { path: fullPath, mimeType: att.mimeType || 'application/octet-stream', filename: att.originalName }
}

const remove = async (id, organizationId) => {
  const att = await getByIdScoped(id, organizationId)
  const fullPath = path.join(STORAGE_ROOT, att.storedName)
  try { if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath) } catch (_) { /* ignore */ }
  await att.destroy()
}

module.exports = { list, getById, getByIdScoped, create, streamFile, remove, MAX_SIZE_BYTES, ALLOWED_MIME }
