const rateLimit = require('express-rate-limit')

const API_WINDOW_MS = 15 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const MAX_LIMIT = 100
const MAX_PAGE = 1_000_000

const READ_MAX = parseInt(process.env.RATE_LIMIT_API_MAX, 10) || 1500
const WRITE_MAX = parseInt(process.env.RATE_LIMIT_WRITE_MAX, 10) || 300

const limiter = (opts) => rateLimit({
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ...opts,
})

// ── Global (mounted once on /api in app.js) ───────────────────────────────────
// Generous read ceiling for SPA traffic; tighter write budget for mutating
// methods. Both are per-IP and tunable via RATE_LIMIT_API_MAX / RATE_LIMIT_WRITE_MAX.
const apiRateLimit = limiter({
  windowMs: API_WINDOW_MS,
  limit: READ_MAX,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})

const writeRateLimit = limiter({
  windowMs: API_WINDOW_MS,
  limit: WRITE_MAX,
  skip: (req) => !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method),
  message: { success: false, message: 'Too many write requests. Please try again later.' },
})

// ── Auth flows (opt-in per route in auth.routes.js) ───────────────────────────
const loginLimiter = limiter({
  windowMs: API_WINDOW_MS,
  limit: 10,
  message: { success: false, message: 'Too many attempts — please try again in 15 minutes.' },
})

const registerLimiter = limiter({
  windowMs: HOUR_MS,
  limit: 5,
  message: { success: false, message: 'Too many registration attempts — please try again in an hour.' },
})

const emailLimiter = limiter({
  windowMs: HOUR_MS,
  limit: 5,
  message: { success: false, message: 'Too many email requests — please try again later.' },
})

// Silent refresh fires on load and token expiry — cap cookie probing, not normal use.
const refreshLimiter = limiter({
  windowMs: API_WINDOW_MS,
  limit: 60,
  message: { success: false, message: 'Too many token refreshes — please try again shortly.' },
})

// Token-bearing routes (reset/verify) — defence in depth against brute force.
const tokenLimiter = limiter({
  windowMs: API_WINDOW_MS,
  limit: 20,
  message: { success: false, message: 'Too many attempts — please try again in 15 minutes.' },
})

// Impersonation switch — privileged admin action.
const impersonationLimiter = limiter({
  windowMs: API_WINDOW_MS,
  limit: 30,
  message: { success: false, message: 'Too many session switches — please try again shortly.' },
})

/**
 * Coerce a query value (string, repeated array, or undefined) to an integer in
 * [min, max]. Returns null when unusable / below min so the caller can drop the
 * key and leave the controller default; values above max are capped.
 */
function clampInt(raw, min, max) {
  const scalar = Array.isArray(raw) ? raw[raw.length - 1] : raw
  const n = Math.floor(Number(scalar))
  if (!Number.isFinite(n) || n < min) return null
  return Math.min(n, max)
}

/**
 * Clamp pagination query params for every request before any list endpoint
 * sees them. Replaces `req.query` with a plain object so the change sticks
 * even when Express memoises the query getter.
 *
 * Invalid/absent page|limit keys are dropped (controller defaults apply).
 * Out-of-range values are capped. Repeated params use the last value.
 */
function sanitizePagination(req, res, next) {
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

  Object.defineProperty(req, 'query', {
    value: q,
    writable: true,
    configurable: true,
    enumerable: true,
  })
  next()
}

module.exports = {
  apiRateLimit,
  writeRateLimit,
  sanitizePagination,
  loginLimiter,
  registerLimiter,
  emailLimiter,
  refreshLimiter,
  tokenLimiter,
  impersonationLimiter,
  API_WINDOW_MS,
  MAX_LIMIT,
  MAX_PAGE,
  clampInt,
  READ_MAX,
  WRITE_MAX,
}
