/**
 * Normalise the pagination query params (`page`, `limit`) for every request.
 *
 * List endpoints across the app read `req.query.page` / `req.query.limit` and
 * pass them straight to a `findAndCountAll` as the SQL LIMIT/OFFSET. Without a
 * ceiling a client could request `?limit=99999999` and force the server to
 * materialise an enormous result set (memory-exhaustion DoS), or `?page=-5`
 * which yields a negative OFFSET (a hard DB error / 500). This caps `limit` to a
 * sane maximum and floors `page` at 1 so a hostile or malformed value can never
 * reach the query layer.
 *
 * Values are clamped, not rejected: an out-of-range `limit` is capped, and an
 * invalid/absent one is dropped so each controller's own default still applies.
 * Replaces `req.query` with a sanitised plain object so the change sticks
 * regardless of how the framework memoises the query getter.
 */
const MAX_LIMIT = 100
const MAX_PAGE = 1_000_000 // a larger page is meaningless and only bloats OFFSET

// Coerce a query value (which may be a string, an array when the param is
// repeated, or undefined) to an integer in [min, max]. Returns null when it
// isn't a usable number or falls below `min`, so the caller drops it and the
// controller's own default applies; values above `max` are capped.
const clampInt = (raw, min, max) => {
  const scalar = Array.isArray(raw) ? raw[raw.length - 1] : raw
  const n = Math.floor(Number(scalar))
  if (!Number.isFinite(n) || n < min) return null
  return Math.min(n, max)
}

const sanitizeQuery = (req, res, next) => {
  const q = { ...(req.query || {}) }

  if ('limit' in q) {
    const v = clampInt(q.limit, 1, MAX_LIMIT)
    if (v == null) delete q.limit
    else q.limit = String(v)
  }
  if ('page' in q) {
    const v = clampInt(q.page, 1, MAX_PAGE)
    if (v == null) delete q.page
    else q.page = String(v)
  }

  Object.defineProperty(req, 'query', { value: q, writable: true, configurable: true, enumerable: true })
  next()
}

module.exports = sanitizeQuery
module.exports.MAX_LIMIT = MAX_LIMIT
module.exports.MAX_PAGE = MAX_PAGE
