/**
 * auth.cookies.js — httpOnly cookie helpers for the refresh-token flow.
 *
 * The refresh token never touches client-readable storage: it lives in an
 * httpOnly, SameSite=Strict cookie (Secure follows the request scheme — see
 * config.cookieSecure — so the same flow works over http and https). The access token
 * stays in browser memory and is re-minted from this cookie on page load.
 * During impersonation the admin's own refresh token is parked in a second
 * cookie so "return to admin" can restore it without exposing it to JS.
 */
const config = require('../../config/config')

const REFRESH_COOKIE = 'refreshToken'
const IMPERSONATOR_COOKIE = 'impersonatorRefreshToken'

// Refresh-cookie lifetime in ms, derived from the configured JWT refresh TTL
// (e.g. "7d", "12h", "3600"). Falls back to 7 days if it can't be parsed.
function refreshMaxAgeMs() {
  const v = String(config.jwt.refreshExpiresIn || '7d').trim()
  const m = v.match(/^(\d+)\s*([smhd])?$/i)
  if (!m) return 7 * 24 * 60 * 60 * 1000
  const n = parseInt(m[1], 10)
  const unit = (m[2] || 's').toLowerCase()
  const mult = unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1
  return n * mult * 1000
}

// Whether to set the Secure flag for this request. 'auto' (default) mirrors the
// request scheme: Secure over https, not over http — so the cookie is usable
// under both. 'true'/'false' force it regardless of scheme.
function secureFor(req) {
  if (config.cookieSecure === 'true')  return true
  if (config.cookieSecure === 'false') return false
  return !!(req && (req.secure || req.headers?.['x-forwarded-proto'] === 'https'))
}

// Shared attributes. Path=/api so the cookie reaches every API route (auth +
// profile session detection) but nothing else.
function baseOpts(req) {
  return {
    httpOnly: true,
    secure: secureFor(req),
    sameSite: 'strict',
    path: '/api',
  }
}

// Minimal cookie-header parser — avoids pulling in cookie-parser just to read
// one or two values. Returns '' when the cookie is absent.
function readCookie(req, name) {
  const header = req.headers && req.headers.cookie
  if (!header) return ''
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim())
    }
  }
  return ''
}

function setRefreshCookie(req, res, token, { persist = true } = {}) {
  const opts = baseOpts(req)
  if (persist) opts.maxAge = refreshMaxAgeMs() // omit → session cookie
  res.cookie(REFRESH_COOKIE, token, opts)
}

function clearRefreshCookie(req, res) {
  res.clearCookie(REFRESH_COOKIE, baseOpts(req))
}

function setImpersonatorCookie(req, res, token) {
  res.cookie(IMPERSONATOR_COOKIE, token, { ...baseOpts(req), maxAge: refreshMaxAgeMs() })
}

function clearImpersonatorCookie(req, res) {
  res.clearCookie(IMPERSONATOR_COOKIE, baseOpts(req))
}

module.exports = {
  REFRESH_COOKIE,
  IMPERSONATOR_COOKIE,
  readCookie,
  setRefreshCookie,
  clearRefreshCookie,
  setImpersonatorCookie,
  clearImpersonatorCookie,
}
