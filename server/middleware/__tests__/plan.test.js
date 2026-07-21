jest.mock('../../modules/billing/billing.service', () => ({
  checkLimit: jest.fn(),
  increment: jest.fn(),
  hasFeature: jest.fn(),
}))

const billing = require('../../modules/billing/billing.service')
const { enforceLimit, meter, requireFeature } = require('../plan')

const response = () => {
  const listeners = {}
  return {
    statusCode: 200,
    status: jest.fn(function setStatus(code) { this.statusCode = code; return this }),
    json: jest.fn(),
    on: jest.fn((event, listener) => { listeners[event] = listener }),
    finish: () => listeners.finish?.(),
  }
}

beforeEach(() => jest.clearAllMocks())

test('enforceLimit blocks a request that exceeds a subscription quota', async () => {
  billing.checkLimit.mockResolvedValue({ allowed: false, limit: 20, used: 20 })
  const res = response(); const next = jest.fn()

  await enforceLimit('erp.invoices.monthly')({ user: { id: 'org-1' } }, res, next)

  expect(next).not.toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(403)
})

test('meter records only successful requests', async () => {
  const res = response(); const next = jest.fn()
  meter('erp.invoices.monthly')({ user: { id: 'org-1' } }, res, next)
  res.finish()
  await Promise.resolve()
  expect(billing.increment).toHaveBeenCalledWith('org-1', 'erp.invoices.monthly', 1)

  billing.increment.mockClear()
  const failed = response(); failed.statusCode = 422
  meter('erp.invoices.monthly')({ user: { id: 'org-1' } }, failed, jest.fn())
  failed.finish()
  expect(billing.increment).not.toHaveBeenCalled()
})

test('requireFeature blocks a plan that does not include the requested feature', async () => {
  billing.hasFeature.mockResolvedValue(false)
  const res = response(); const next = jest.fn()

  await requireFeature('ai-agent')({ user: { id: 'org-1', role: 'user' } }, res, next)

  expect(next).not.toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(403)
})

test('requireFeature leaves platform administrators unrestricted', async () => {
  const next = jest.fn()

  await requireFeature('ai-agent')({ user: { id: 'admin-1', role: 'admin' } }, response(), next)

  expect(next).toHaveBeenCalled()
  expect(billing.hasFeature).not.toHaveBeenCalled()
})

test('enforceLimit serializes concurrent checks for the same organization and metric', async () => {
  billing.checkLimit.mockResolvedValue({ allowed: true })
  const first = response(); const second = response()
  const nextFirst = jest.fn(); const nextSecond = jest.fn()

  await enforceLimit('erp.invoices.monthly')({ user: { id: 'org-1' } }, first, nextFirst)
  const waiting = enforceLimit('erp.invoices.monthly')({ user: { id: 'org-1' } }, second, nextSecond)
  await Promise.resolve()
  expect(billing.checkLimit).toHaveBeenCalledTimes(1)

  first.finish()
  await waiting
  expect(billing.checkLimit).toHaveBeenCalledTimes(2)
  second.finish()
})
