const { Op } = require('sequelize')
const { AuditLog } = require('../../../server/models')
const config = require('../../../server/config/config')
const logger = require('../../../server/core/logger').forLabel('audit')

const auditCfg = config.audit || {}
const BATCH_SIZE        = auditCfg.batchSize       || 100
const MAX_SUMMARY_BYTES = auditCfg.maxSummaryBytes || 4096

// ── Write buffer ──────────────────────────────────────────────────────────────
// Business actions enqueue rows here; they're persisted in batches (bulkCreate)
// rather than one INSERT per action. This keeps the audit trail off the request
// hot path and lets a single writer (SQLite) keep up at high volume. The buffer
// flushes on a timer (started by app.js), when it fills, and on shutdown.
let queue = []
let flushTimer = null

// Keep summaries bounded so a pathological payload can't bloat the table.
const capSummary = (summary) => {
  if (summary == null) return null
  try {
    const json = JSON.stringify(summary)
    if (Buffer.byteLength(json) <= MAX_SUMMARY_BYTES) return summary
    return { truncated: true, bytes: Buffer.byteLength(json) }
  } catch {
    return null
  }
}

/**
 * Persist all buffered rows. Never throws — a failed flush logs and drops the
 * batch rather than crashing the writer or wedging the queue.
 */
const flushNow = async () => {
  if (!queue.length) return
  const batch = queue
  queue = []
  try {
    await AuditLog.bulkCreate(batch)
  } catch (err) {
    logger.error('failed to flush batch', { count: batch.length, error: err.message || String(err) })
  }
}

const startFlushTimer = (intervalMs = auditCfg.flushIntervalMs || 2000) => {
  if (flushTimer) return flushTimer
  flushTimer = setInterval(() => { flushNow() }, intervalMs)
  // Don't let the audit timer keep the process alive on its own.
  if (typeof flushTimer.unref === 'function') flushTimer.unref()
  return flushTimer
}

const stopFlushTimer = () => {
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null }
}

/**
 * Record an audit event. Never throws — audit failures must not break the
 * underlying business operation. Enqueues the row for batched persistence.
 *
 *   audit.log({ user, action: 'invoice.send', entityType: 'Invoice', entityId, summary })
 */
const log = async ({ user, userId, userEmail, action, entityType, entityId, summary, organizationId, method, ip }) => {
  try {
    const resolvedUserId = user?.id || userId || null
    let orgId         = organizationId || user?.organizationId || user?.id || null
    let resolvedEmail = user?.email || userEmail || null

    // Most callers only pass userId — look up the user to derive the effective
    // organizationId so audit rows are visible in the org-scoped list query.
    // Same convention as controllers: organizationId || user.id (self-org).
    if ((!orgId || !resolvedEmail) && resolvedUserId) {
      const { User } = require('../../../server/models')
      const u = await User.findByPk(resolvedUserId, { attributes: ['id', 'organizationId', 'email'] })
      if (u) {
        orgId         = orgId         || u.organizationId || u.id
        resolvedEmail = resolvedEmail || u.email
      }
    }

    queue.push({
      userId:         resolvedUserId,
      userEmail:      resolvedEmail,
      action,
      entityType,
      entityId:       entityId || null,
      method:         method   || null,
      ip:             ip       || null,
      summary:        capSummary(summary),
      organizationId: orgId,
      // Stamp at enqueue time (when the action happened), not flush time, so
      // ordering and keyset cursors are stable regardless of batch latency.
      createdAt:      new Date(),
    })

    if (queue.length >= BATCH_SIZE) flushNow()
  } catch (err) {
    logger.error('failed to record event', { action, error: err.message || String(err) })
  }
}

// ── Keyset cursor helpers ───────────────────────────────────────────────────
// Cursors encode the last seen row's (createdAt, id); the list query pages with
// (createdAt, id) < cursor under a DESC order, so there's no OFFSET scan and no
// per-page COUNT(*) — both of which fall over at ~1M rows.
const encodeCursor = (row) => {
  if (!row) return null
  const c = row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt
  return Buffer.from(JSON.stringify({ c, i: row.id })).toString('base64')
}

const decodeCursor = (cursor) => {
  if (!cursor) return null
  try {
    const { c, i } = JSON.parse(Buffer.from(String(cursor), 'base64').toString('utf8'))
    if (!c || !i) return null
    return { createdAt: new Date(c), id: i }
  } catch {
    return null
  }
}

/**
 * List audit rows, newest first, with keyset pagination.
 *
 * Returns { logs, nextCursor, hasMore, total }. `total` is only computed when
 * `withCount` is set (the AI tools want an exact count; the UI uses Load-more
 * and omits it to avoid a full-table COUNT).
 */
const list = async ({
  limit = 50, cursor = '',
  entityType = '', entityId = '', userId = '', action = '',
  dateFrom = '', dateTo = '', organizationId, withCount = false,
} = {}) => {
  const where = { organizationId: organizationId || null }
  if (entityType) where.entityType = entityType
  if (entityId)   where.entityId   = entityId
  if (userId)     where.userId     = userId
  if (action)     where.action     = { [Op.like]: `%${action}%` }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom)
    if (dateTo)   where.createdAt[Op.lte] = new Date(`${dateTo}T23:59:59.999Z`)
  }

  // Count (optional) is taken before the cursor is applied — it's the size of
  // the filtered set, not of the current page.
  const total = withCount ? await AuditLog.count({ where }) : undefined

  const after = decodeCursor(cursor)
  if (after) {
    where[Op.and] = [
      ...(where[Op.and] || []),
      { [Op.or]: [
        { createdAt: { [Op.lt]: after.createdAt } },
        { createdAt: after.createdAt, id: { [Op.lt]: after.id } },
      ] },
    ]
  }

  // Fetch one extra row to know whether another page exists without a COUNT.
  const rows = await AuditLog.findAll({
    where,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit: limit + 1,
  })

  const hasMore = rows.length > limit
  const logs    = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? encodeCursor(logs[logs.length - 1]) : null

  return { logs, nextCursor, hasMore, total }
}

/**
 * Delete audit rows older than the configured retention horizon. No-op when
 * retention is disabled (0). Never throws. Returns the number of rows removed.
 */
const pruneExpiredLogs = async () => {
  const days = auditCfg.retentionDays
  if (!days || days <= 0) return 0
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const removed = await AuditLog.destroy({ where: { createdAt: { [Op.lt]: cutoff } } })
    if (removed) logger.info('pruned expired audit rows', { removed, olderThanDays: days })
    return removed
  } catch (err) {
    logger.error('failed to prune expired rows', { error: err.message || String(err) })
    return 0
  }
}

module.exports = {
  log, list, pruneExpiredLogs,
  flushNow, startFlushTimer, stopFlushTimer,
  encodeCursor, decodeCursor,
}
