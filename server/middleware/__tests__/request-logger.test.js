// Security tests for middleware/request-logger.
//
// The security-relevant job here is to keep single-use secrets that travel in
// the URL path (email-verification + password-reset tokens) OUT of the logs,
// where they could otherwise be replayed. We mock the logger with a STABLE
// instance so the spy captured at module-load is the one we assert on.

jest.mock('../../core/logger', () => {
  const log = jest.fn()
  const instance = { log }
  return { forLabel: () => instance }
})

const logger = require('../../core/logger').forLabel('http')
const requestLogger = require('../request-logger')

// res that lets us drive the deferred 'finish' log.
const makeRes = (statusCode = 200) => {
  const handlers = {}
  return {
    statusCode,
    on: (ev, cb) => { handlers[ev] = cb },
    finish: () => handlers.finish && handlers.finish(),
  }
}
const makeReq = (over = {}) => ({ method: 'GET', path: '/api/x', originalUrl: '/api/x', ip: '1.2.3.4', ...over })

beforeEach(() => jest.clearAllMocks())

describe('requestLogger — token redaction (secret-leak prevention)', () => {
  test('redacts an email-verification token from both the message and the path field', () => {
    const req = makeReq({ method: 'GET', path: '/api/auth/verify-email/SUPERSECRET', originalUrl: '/api/auth/verify-email/SUPERSECRET' })
    const res = makeRes(200); const next = jest.fn()
    requestLogger(req, res, next)
    res.finish()

    const [, message, meta] = logger.log.mock.calls[0]
    expect(message).not.toContain('SUPERSECRET')
    expect(message).toContain('[redacted]')
    expect(meta.path).toBe('/api/auth/verify-email/[redacted]')
    expect(meta.path).not.toContain('SUPERSECRET')
  })

  test('redacts a password-reset token', () => {
    const req = makeReq({ path: '/api/auth/reset-password/RESETME', originalUrl: '/api/auth/reset-password/RESETME?x=1' })
    const res = makeRes(200)
    requestLogger(req, res, jest.fn())
    res.finish()
    const [, message, meta] = logger.log.mock.calls[0]
    expect(message).not.toContain('RESETME')
    expect(meta.path).toContain('[redacted]')
  })

  test('leaves an ordinary path untouched', () => {
    const req = makeReq({ path: '/api/erp/invoices', originalUrl: '/api/erp/invoices?page=2' })
    const res = makeRes(200)
    requestLogger(req, res, jest.fn())
    res.finish()
    expect(logger.log.mock.calls[0][2].path).toBe('/api/erp/invoices?page=2')
  })
})

describe('requestLogger — behaviour', () => {
  test('skips the noisy health endpoint entirely', () => {
    const req = makeReq({ path: '/api/health' })
    const next = jest.fn()
    requestLogger(req, makeRes(200), next)
    expect(next).toHaveBeenCalled()
    expect(logger.log).not.toHaveBeenCalled()
  })

  test('maps the response status to a log level (5xx→error, 4xx→warn, 2xx→info)', () => {
    for (const [status, level] of [[500, 'error'], [403, 'warn'], [200, 'info']]) {
      logger.log.mockClear()
      const res = makeRes(status)
      requestLogger(makeReq(), res, jest.fn())
      res.finish()
      expect(logger.log.mock.calls[0][0]).toBe(level)
    }
  })

  test('records the authenticated user id when present, null otherwise', () => {
    const res1 = makeRes(200)
    requestLogger(makeReq({ user: { id: 'u9' } }), res1, jest.fn())
    res1.finish()
    expect(logger.log.mock.calls[0][2].userId).toBe('u9')

    logger.log.mockClear()
    const res2 = makeRes(200)
    requestLogger(makeReq(), res2, jest.fn())
    res2.finish()
    expect(logger.log.mock.calls[0][2].userId).toBeNull()
  })
})
