/**
 * auth.cookies.js — httpOnly cookie helpers for the refresh-token flow.
 *
 * The refresh token never touches client-readable storage: it lives in an
 * httpOnly, SameSite=Strict cookie (Secure in production). The access token
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

// Shared attributes. Path=/api so the cookie reaches every API route (auth +
// profile session detection) but nothing else. Secure only in production so it
// still works over http://localhost in dev.
function baseOpts() {
  return {
    httpOnly: true,
    secure: config.env === 'production',
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

function setRefreshCookie(res, token, { persist = true } = {}) {
  const opts = baseOpts()
  if (persist) opts.maxAge = refreshMaxAgeMs() // omit → session cookie
  res.cookie(REFRESH_COOKIE, token, opts)
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, baseOpts())
}

function setImpersonatorCookie(res, token) {
  res.cookie(IMPERSONATOR_COOKIE, token, { ...baseOpts(), maxAge: refreshMaxAgeMs() })
}

function clearImpersonatorCookie(res) {
  res.clearCookie(IMPERSONATOR_COOKIE, baseOpts())
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
