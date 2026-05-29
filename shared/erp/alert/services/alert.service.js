const { Op } = require('sequelize')
const { Alert, AlertRead, Employee, Department } = require('../../../../server/models')
const { findByPkScoped } = require('../../../../server/core/tenant')

// ── Membership helpers (also used by the realtime layer for room joins) ───────

// Department ids the user belongs to (via their linked Employee record).
const getUserDepartmentIds = async (userId) => {
  if (!userId) return []
  const emp = await Employee.findOne({
    where: { userId },
    include: [{ model: Department, as: 'departments', attributes: ['id'] }],
  })
  if (!emp) return []
  return (emp.departments || []).map((d) => d.id)
}

// Module slugs the user has access to (direct assignment + via roles).
const getUserModuleSlugs = async (userId) => {
  if (!userId) return []
  const orgSvc = require('../../../../server/modules/organizations/organization.service')
  const mods = await orgSvc.getMyModules(userId)
  return mods.map((m) => m.slug)
}

// ── Visibility ────────────────────────────────────────────────────────────────

const notExpired = () => ({ [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }] })

// Build the WHERE clause for alerts a given user is allowed to see in their bell.
// Admins see every scope; other users see global + their modules + their depts.
const buildVisibilityWhere = async (user, organizationId) => {
  const base = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }

  if (user?.role === 'admin') {
    return { [Op.and]: [base, notExpired()] }
  }

  const [deptIds, moduleSlugs] = await Promise.all([
    getUserDepartmentIds(user.id),
    getUserModuleSlugs(user.id),
  ])

  const scopeOr = [{ scope: 'global' }]
  if (moduleSlugs.length) scopeOr.push({ scope: 'module', moduleSlug: { [Op.in]: moduleSlugs } })
  if (deptIds.length) scopeOr.push({ scope: 'department', departmentId: { [Op.in]: deptIds } })

  return { [Op.and]: [base, { [Op.or]: scopeOr }, notExpired()] }
}

// Attach the department name (resolved separately, no association) + per-user
// read flag onto a list of plain alert rows.
const decorate = async (alerts, userId) => {
  const deptIds = [...new Set(alerts.map((a) => a.departmentId).filter(Boolean))]
  const deptMap = {}
  if (deptIds.length) {
    const depts = await Department.findAll({ where: { id: { [Op.in]: deptIds } }, attributes: ['id', 'name'] })
    depts.forEach((d) => { deptMap[d.id] = d.name })
  }

  let readSet = new Set()
  if (userId && alerts.length) {
    const reads = await AlertRead.findAll({
      where: { userId, alertId: { [Op.in]: alerts.map((a) => a.id) } },
      attributes: ['alertId'],
    })
    readSet = new Set(reads.map((r) => r.alertId))
  }

  return alerts.map((a) => {
    const plain = a.get ? a.get({ plain: true }) : a
    return { ...plain, departmentName: plain.departmentId ? deptMap[plain.departmentId] || null : null, isRead: readSet.has(plain.id) }
  })
}

// ── Bell feed (current user) ────────────────────────────────────────────────

const listForUser = async (user, { limit = 50 } = {}) => {
  const organizationId = user?.organizationId || user?.id
  const where = await buildVisibilityWhere(user, organizationId)
  const rows = await Alert.findAll({ where, order: [['createdAt', 'DESC']], limit })
  const alerts = await decorate(rows, user.id)
  const unread = alerts.filter((a) => !a.isRead).length
  return { alerts, unread }
}

const unreadCount = async (user) => {
  const organizationId = user?.organizationId || user?.id
  const where = await buildVisibilityWhere(user, organizationId)
  const rows = await Alert.findAll({ where, attributes: ['id'] })
  if (!rows.length) return 0
  const reads = await AlertRead.findAll({
    where: { userId: user.id, alertId: { [Op.in]: rows.map((r) => r.id) } },
    attributes: ['alertId'],
  })
  return rows.length - reads.length
}

const markRead = async (alertId, userId) => {
  const [row] = await AlertRead.findOrCreate({ where: { alertId, userId }, defaults: { alertId, userId } })
  return row
}

const markAllRead = async (user) => {
  const organizationId = user?.organizationId || user?.id
  const where = await buildVisibilityWhere(user, organizationId)
  const rows = await Alert.findAll({ where, attributes: ['id'] })
  for (const r of rows) {
    await AlertRead.findOrCreate({ where: { alertId: r.id, userId: user.id }, defaults: { alertId: r.id, userId: user.id } })
  }
  return rows.length
}

// ── Management (authors) ───────────────────────────────────────────────────────

const listAll = async ({ page = 1, limit = 20, scope = '', search = '', organizationId }) => {
  const offset = (page - 1) * limit
  const where = { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } }
  if (scope) where.scope = scope
  if (search) where.title = { [Op.like]: `%${search}%` }

  const { count, rows } = await Alert.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] })
  const alerts = await decorate(rows, null)
  return { total: count, page, limit, alerts }
}

const getById = async (id, organizationId) => {
  const alert = await findByPkScoped(Alert, id, organizationId)
  if (!alert) throw { status: 404, message: 'Alert not found' }
  return alert
}

const ALLOWED = ['title', 'body', 'severity', 'scope', 'moduleSlug', 'departmentId', 'link', 'expiresAt']

// Normalise scope-dependent fields so a global alert never keeps a stale
// moduleSlug/departmentId from a previous scope selection.
const normalizeScope = (data) => {
  const out = { ...data }
  if (out.scope === 'module') { out.departmentId = null }
  else if (out.scope === 'department') { out.moduleSlug = null }
  else if (out.scope === 'global') { out.moduleSlug = null; out.departmentId = null }
  return out
}

const create = async (data) => {
  const { userId, organizationId } = data
  if (!data.title?.trim()) throw { status: 400, message: 'Title is required' }
  const payload = normalizeScope(Object.fromEntries(Object.entries(data).filter(([k]) => ALLOWED.includes(k))))
  payload.title = data.title.trim()
  payload.scope = payload.scope || 'global'
  payload.severity = payload.severity || 'info'
  payload.expiresAt = payload.expiresAt || null
  payload.source = 'manual'
  payload.organizationId = organizationId || null
  payload.createdBy = userId || null
  payload.modifiedBy = userId || null

  const alert = await Alert.create(payload)
  emitChanged(alert, 'new')
  return alert
}

const update = async (id, data, userId, organizationId) => {
  const alert = await findByPkScoped(Alert, id, organizationId)
  if (!alert) throw { status: 404, message: 'Alert not found' }
  const patch = normalizeScope(Object.fromEntries(
    Object.entries(data).filter(([k, v]) => ALLOWED.includes(k) && v !== undefined)
  ))
  if ('expiresAt' in patch) patch.expiresAt = patch.expiresAt || null
  patch.modifiedBy = userId || null
  await alert.update(patch)
  await alert.reload()
  emitChanged(alert, 'update')
  return alert
}

const remove = async (id, organizationId) => {
  const alert = await findByPkScoped(Alert, id, organizationId)
  if (!alert) throw { status: 404, message: 'Alert not found' }
  await alert.update({ dataFlag: 2 })
  emitChanged(alert, 'remove')
}

// ── Options for the author form (target pickers) ──────────────────────────────

const options = async (organizationId) => {
  const moduleLoader = require('../../../../server/core/module.loader')
  const modules = moduleLoader.getAll()
    .map((m) => ({ slug: m.slug, name: m.name || m.slug }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const depts = await Department.findAll({
    where: { organizationId: organizationId || null, dataFlag: { [Op.ne]: 2 } },
    attributes: ['id', 'name'],
    order: [['name', 'ASC']],
  })
  return { modules, departments: depts.map((d) => ({ id: d.id, name: d.name })) }
}

// ── System emit helper (other modules can raise realtime alerts) ──────────────

// Lazy require avoids a circular dependency with the realtime layer.
const emitChanged = (alert, reason) => {
  try {
    require('../../../../server/core/realtime').emitAlertsChanged(alert, reason)
  } catch (_) { /* realtime not initialised (e.g. tests) — ignore */ }
}

// Create + broadcast an alert from application code (low-stock, approvals, …).
const emitSystem = async ({ title, body, severity = 'info', scope = 'global', moduleSlug = null, departmentId = null, link = null, expiresAt = null, organizationId }) => {
  if (!title?.trim()) throw { status: 400, message: 'Title is required' }
  const alert = await Alert.create(normalizeScope({
    title: title.trim(), body, severity, scope, moduleSlug, departmentId, link,
    expiresAt: expiresAt || null, source: 'system', organizationId: organizationId || null,
  }))
  emitChanged(alert, 'new')
  return alert
}

module.exports = {
  getUserDepartmentIds, getUserModuleSlugs,
  listForUser, unreadCount, markRead, markAllRead,
  listAll, getById, create, update, remove, options, emitSystem,
}
