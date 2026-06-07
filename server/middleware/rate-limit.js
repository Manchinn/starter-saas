const rateLimit = require('express-rate-limit')

/**
 * Shared rate limiters so every router throttles consistently. Mount these
 * before `authenticate` so unauthenticated floods are capped before they reach
 * any auth or DB work.
 *
 *   apiLimiter   — blanket read/write ceiling for a router (router.use).
 *   writeLimiter — tighter cap for mutating endpoints (POST/PUT/PATCH/DELETE).
 *
 * Auth flows (login/register/etc.) keep their own purpose-built limiters in
 * server/modules/auth/auth.routes.js.
 */
const WINDOW_MS = 15 * 60 * 1000

const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 100,
  message: { success: false, message: 'Too many requests — please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const writeLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 30,
  message: { success: false, message: 'Too many write requests — please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { apiLimiter, writeLimiter }
