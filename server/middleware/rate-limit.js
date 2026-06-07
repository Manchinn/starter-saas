const rateLimit = require('express-rate-limit')

/**
 * Shared rate limiters so every router throttles consistently. Mount the
 * generic ones before `authenticate` so unauthenticated floods are capped
 * before they reach any auth or DB work.
 *
 *   apiLimiter   — blanket read/write ceiling for a router (router.use).
 *   writeLimiter — tighter cap for mutating endpoints (POST/PUT/PATCH/DELETE).
 *
 * The auth-specific limiters below are tuned per flow (login/register/email/
 * etc.) and consumed by server/modules/auth/auth.routes.js.
 */
const MIN_15 = 15 * 60 * 1000
const HOUR_1 = 60 * 60 * 1000

const limiter = (opts) => rateLimit({ standardHeaders: true, legacyHeaders: false, ...opts })

// ── Generic ──────────────────────────────────────────────────────────────────
const apiLimiter = limiter({
  windowMs: MIN_15,
  max: 100,
  message: { success: false, message: 'Too many requests — please try again shortly.' },
})

const writeLimiter = limiter({
  windowMs: MIN_15,
  max: 30,
  message: { success: false, message: 'Too many write requests — please try again shortly.' },
})

// ── Auth flows ───────────────────────────────────────────────────────────────
// Loose enough not to bother real users; tight enough to slow credential
// stuffing and email-spam abuse.
const loginLimiter = limiter({
  windowMs: MIN_15,
  max: 10,
  message: { success: false, message: 'Too many attempts — please try again in 15 minutes.' },
})

const registerLimiter = limiter({
  windowMs: HOUR_1,
  max: 5,
  message: { success: false, message: 'Too many registration attempts — please try again in an hour.' },
})

const emailLimiter = limiter({
  windowMs: HOUR_1,
  max: 5,
  message: { success: false, message: 'Too many email requests — please try again later.' },
})

// Silent refresh fires on page load and whenever the access token expires, so
// this is loose — it only exists to cap a client hammering /refresh or probing
// stolen cookies, not to throttle normal use.
const refreshLimiter = limiter({
  windowMs: MIN_15,
  max: 60,
  message: { success: false, message: 'Too many token refreshes — please try again shortly.' },
})

// Token-bearing routes (reset/verify) — the tokens are random and high-entropy,
// but rate-limit anyway to deny brute-force guessing as defence in depth.
const tokenLimiter = limiter({
  windowMs: MIN_15,
  max: 20,
  message: { success: false, message: 'Too many attempts — please try again in 15 minutes.' },
})

// Impersonation switch/return — privileged admin actions; keep them modest.
const impersonationLimiter = limiter({
  windowMs: MIN_15,
  max: 30,
  message: { success: false, message: 'Too many session switches — please try again shortly.' },
})

module.exports = {
  apiLimiter,
  writeLimiter,
  loginLimiter,
  registerLimiter,
  emailLimiter,
  refreshLimiter,
  tokenLimiter,
  impersonationLimiter,
}
