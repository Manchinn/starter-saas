const rateLimit = require('express-rate-limit')

const API_WINDOW_MS = 15 * 60 * 1000

const apiRateLimit = rateLimit({
  windowMs: API_WINDOW_MS,
  limit: 1500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})

const writeRateLimit = rateLimit({
  windowMs: API_WINDOW_MS,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method),
  message: { success: false, message: 'Too many write requests. Please try again later.' },
})

function sanitizePagination(req, res, next) {
  if (req.query.page !== undefined) {
    const page = Number.parseInt(req.query.page, 10)
    req.query.page = String(Number.isFinite(page) ? Math.min(Math.max(page, 1), 1000000) : 1)
  }
  if (req.query.limit !== undefined) {
    const limit = Number.parseInt(req.query.limit, 10)
    req.query.limit = String(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20)
  }
  next()
}

module.exports = { apiRateLimit, writeRateLimit, sanitizePagination, API_WINDOW_MS }
