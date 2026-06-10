// Security tests for middleware/plan — the subscription-plan gates.
//
// requireFeature / enforceLimit are authorization boundaries: a request that the
// plan doesn't permit must be blocked, and — crucially — if the billing check
// itself throws, the gate must FAIL CLOSED (500, no next()) rather than letting
// the request through. meter counts usage only for successful responses.
// billing + logger are mocked so this is pure middleware logic.

jest.mock('../../modules/billing/billing.service', () => ({
  hasFeature: jest.fn(),
  checkLimit: jest.fn(),
  increment:  jest.fn(),
}))
jest.mock('../../core/logger', () => ({ forLabel: () => ({ error: jest.fn() }) }))

const billing = require('../../modules/billing/billing.service')
const { requireFeature, enforceLimit, meter, orgKeyOf } = require('../plan')

const makeRes = () => {
  const r = {}
  r.status = jest.fn(() => r)
  r.json   = jest.fn(() => r)
  return r
}

// res that captures the 'finish' listener so meter's deferred counting can fire.
const makeFinishRes = (statusCode = 200) => {
  const handlers = {}
  return {
    statusCode,
    on: (ev, cb) => { handlers[ev] = cb },
    finish: () => handlers.finish && handlers.finish(),
  }
}

beforeEach(() => jest.clearAllMocks())

describe('plan.orgKeyOf', () => {
  test('prefers the staff user\'s organizationId', () => {
    expect(orgKeyOf({ user: { id: 'u1', organizationId: 'o1' } })).toBe('o1')
  })
  test('falls back to the user id (the user IS the org)', () => {
    expect(orgKeyOf({ user: { id: 'o1' } })).toBe('o1')
  })
  test('is null when there is no user', () => {
    expect(orgKeyOf({})).toBeNull()
    expect(orgKeyOf(undefined)).toBeNull()
  })
})

describe('plan.requireFeature', () => {
  test('401 when the request carries no org key', async () => {
    const res = makeRes(); const next = jest.fn()
    await requireFeature('ai-agent')({}, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  test('passes when the plan includes the feature', async () => {
    billing.hasFeature.mockResolvedValue(true)
    const res = makeRes(); const next = jest.fn()
    await requireFeature('ai-agent')({ user: { id: 'o1' } }, res, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  test('403 FEATURE_NOT_IN_PLAN when the plan lacks the feature', async () => {
    billing.hasFeature.mockResolvedValue(false)
    const res = makeRes(); const next = jest.fn()
    await requireFeature('ai-agent')({ user: { id: 'o1' } }, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'FEATURE_NOT_IN_PLAN', feature: 'ai-agent' }))
    expect(next).not.toHaveBeenCalled()
  })

  test('fails CLOSED — 500 and no next() — when the billing check throws', async () => {
    billing.hasFeature.mockRejectedValue(new Error('db down'))
    const res = makeRes(); const next = jest.fn()
    await requireFeature('ai-agent')({ user: { id: 'o1' } }, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(next).not.toHaveBeenCalled() // the request is NOT let through on error
  })
})

describe('plan.enforceLimit', () => {
  test('401 when the request carries no org key', async () => {
    const res = makeRes(); const next = jest.fn()
    await enforceLimit('erp.invoices.monthly')({}, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  test('passes when the quota allows the action', async () => {
    billing.checkLimit.mockResolvedValue({ allowed: true })
    const res = makeRes(); const next = jest.fn()
    await enforceLimit('erp.invoices.monthly')({ user: { id: 'o1' } }, res, next)
    expect(next).toHaveBeenCalled()
  })

  test('403 LIMIT_REACHED with used/limit when over quota', async () => {
    billing.checkLimit.mockResolvedValue({ allowed: false, used: 100, limit: 100 })
    const res = makeRes(); const next = jest.fn()
    await enforceLimit('erp.invoices.monthly')({ user: { id: 'o1' } }, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'LIMIT_REACHED', limit: 100, used: 100 }))
    expect(next).not.toHaveBeenCalled()
  })

  test('passes the configured amount through to the limit check', async () => {
    billing.checkLimit.mockResolvedValue({ allowed: true })
    await enforceLimit('m', { amount: 3 })({ user: { id: 'o1' } }, makeRes(), jest.fn())
    expect(billing.checkLimit).toHaveBeenCalledWith('o1', 'm', 3)
  })

  test('fails CLOSED — 500 and no next() — when the limit check throws', async () => {
    billing.checkLimit.mockRejectedValue(new Error('db down'))
    const res = makeRes(); const next = jest.fn()
    await enforceLimit('m')({ user: { id: 'o1' } }, res, next)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(next).not.toHaveBeenCalled()
  })
})

describe('plan.meter', () => {
  test('calls next() immediately and counts usage only after a successful response', () => {
    billing.increment.mockResolvedValue()
    const res = makeFinishRes(201); const next = jest.fn()
    meter('erp.invoices.monthly')({ user: { id: 'o1' } }, res, next)
    expect(next).toHaveBeenCalled()
    expect(billing.increment).not.toHaveBeenCalled() // not yet — response not finished
    res.finish()
    expect(billing.increment).toHaveBeenCalledWith('o1', 'erp.invoices.monthly', 1)
  })

  test('does NOT count when the response failed (status >= 400)', () => {
    const res = makeFinishRes(422)
    meter('m')({ user: { id: 'o1' } }, res, jest.fn())
    res.finish()
    expect(billing.increment).not.toHaveBeenCalled()
  })

  test('does NOT count when there is no org key', () => {
    const res = makeFinishRes(200)
    meter('m')({}, res, jest.fn())
    res.finish()
    expect(billing.increment).not.toHaveBeenCalled()
  })

  test('swallows an increment failure (a metering error never breaks the response)', () => {
    billing.increment.mockRejectedValue(new Error('counter locked'))
    const res = makeFinishRes(200)
    meter('m')({ user: { id: 'o1' } }, res, jest.fn())
    expect(() => res.finish()).not.toThrow()
  })
})
