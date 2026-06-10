// Security tests for modules/billing.controller.
//
// Two boundaries live here and nowhere else:
//   1. The owner gate — a staff member borrows the org's plan but must NOT be
//      able to mutate billing (request a plan change / cancel); only the
//      top-level org account or a system admin may.
//   2. The gateway webhook — the only unauthenticated billing endpoint. Every
//      path through it must end in signature verification or rejection; an
//      unknown provider name must fail safe (fall back to a provider that
//      refuses), never process an event unverified.
//
// The service is mocked. The provider registry runs REAL (manual + scaffolded
// stripe) with config mocked to "unconfigured", because the fail-safe behaviour
// of the registry itself is part of what we're pinning.

jest.mock('../billing.service')
// orgKeyOf re-implemented to avoid dragging the plan middleware's logger/billing
// imports into this suite; same contract as middleware/plan.orgKeyOf.
jest.mock('../../../middleware/plan', () => ({
  orgKeyOf: (req) => req?.user?.organizationId || req?.user?.id || null,
}))
jest.mock('../../../config/config', () => ({
  billing: { stripe: { secretKey: '', webhookSecret: '' } },
  // jest's auto-mock of billing.service still loads the real module to derive
  // its shape, which pulls in models → config/database; give it a dialect.
  db: { dialect: 'sqlite', storage: ':memory:' },
}))

const service = require('../billing.service')
const controller = require('../billing.controller')

const makeRes = () => {
  const r = { statusCode: null, body: null }
  r.status = jest.fn((c) => { r.statusCode = c; return r })
  r.json = jest.fn((b) => { r.body = b; return r })
  return r
}

const OWNER = { id: 'org-1', role: 'user' }                          // top-level org account
const STAFF = { id: 'u2', role: 'user', organizationId: 'org-1' }    // staff member
const ADMIN = { id: 'a1', role: 'admin', organizationId: 'org-x' }   // system admin

beforeEach(() => jest.clearAllMocks())

describe('owner gate — requestPlanChange', () => {
  test('a staff member is refused 403 and the service is never called', async () => {
    const res = makeRes()
    await controller.requestPlanChange({ user: STAFF, body: { planId: 'pro' } }, res)
    expect(res.statusCode).toBe(403)
    expect(res.body.message).toMatch(/organization owner/i)
    expect(service.requestPlanChange).not.toHaveBeenCalled()
  })

  test('the org owner may request, scoped to their own org key', async () => {
    service.requestPlanChange.mockResolvedValue({ id: 'r1' })
    const res = makeRes()
    await controller.requestPlanChange({ user: OWNER, body: { planId: 'pro', note: 'n' } }, res)
    expect(service.requestPlanChange).toHaveBeenCalledWith('org-1', 'pro', { note: 'n' })
    expect(res.statusCode).toBe(200)
  })

  test('a system admin passes the gate even with an organizationId set', async () => {
    service.requestPlanChange.mockResolvedValue({ id: 'r1' })
    const res = makeRes()
    await controller.requestPlanChange({ user: ADMIN, body: { planId: 'pro' } }, res)
    expect(service.requestPlanChange).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
  })
})

describe('owner gate — cancel', () => {
  test('a staff member cannot cancel the org subscription', async () => {
    const res = makeRes()
    await controller.cancel({ user: STAFF, body: {} }, res)
    expect(res.statusCode).toBe(403)
    expect(service.cancel).not.toHaveBeenCalled()
  })

  test('the owner cancels at period end by default; immediate must be explicit', async () => {
    service.cancel.mockResolvedValue({})
    await controller.cancel({ user: OWNER, body: {} }, makeRes())
    expect(service.cancel).toHaveBeenCalledWith('org-1', { atPeriodEnd: true })

    service.cancel.mockClear()
    await controller.cancel({ user: OWNER, body: { immediate: true } }, makeRes())
    expect(service.cancel).toHaveBeenCalledWith('org-1', { atPeriodEnd: false })
  })
})

describe('mySubscription — canManage reflects the owner gate', () => {
  test('staff see canManage=false, the owner sees true', async () => {
    service.getSubscription.mockResolvedValue(null)
    service.getEffectivePlan.mockResolvedValue({})
    service.getUsage.mockResolvedValue({})
    service.getPendingRequest.mockResolvedValue(null)
    service.isUserLocked.mockResolvedValue(false)

    const staffRes = makeRes()
    await controller.mySubscription({ user: STAFF }, staffRes)
    expect(staffRes.body.data.canManage).toBe(false)

    const ownerRes = makeRes()
    await controller.mySubscription({ user: OWNER }, ownerRes)
    expect(ownerRes.body.data.canManage).toBe(true)
  })
})

describe('gateway webhook — unauthenticated, must fail safe', () => {
  const rawBody = Buffer.from('{"type":"checkout.session.completed"}')

  test('the manual provider has no webhooks — event is rejected 400', async () => {
    const res = makeRes()
    await controller.webhook({ params: { provider: 'manual' }, headers: {}, body: rawBody }, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.message).toMatch(/no webhooks/i)
  })

  test('an UNKNOWN provider name falls back to manual and is rejected — never processed unverified', async () => {
    const res = makeRes()
    await controller.webhook({ params: { provider: 'paypal-haxx' }, headers: {}, body: rawBody }, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  test('stripe refuses events while unconfigured (501), even with a signature header', async () => {
    const res = makeRes()
    await controller.webhook(
      { params: { provider: 'stripe' }, headers: { 'stripe-signature': 't=1,v1=sig' }, body: rawBody },
      res,
    )
    expect(res.statusCode).toBe(501)
    expect(res.body.success).toBe(false)
  })
})

describe('admin plan-request decisions — auditable decider', () => {
  test('approve and reject record the acting admin\'s id as decider', async () => {
    service.approvePlanChangeRequest.mockResolvedValue({})
    service.rejectPlanChangeRequest.mockResolvedValue({})

    await controller.adminApprovePlanRequest({ params: { id: 'r1' }, user: ADMIN }, makeRes())
    expect(service.approvePlanChangeRequest).toHaveBeenCalledWith('r1', 'a1')

    await controller.adminRejectPlanRequest({ params: { id: 'r2' }, user: ADMIN, body: { note: 'no' } }, makeRes())
    expect(service.rejectPlanChangeRequest).toHaveBeenCalledWith('r2', 'a1', { note: 'no' })
  })
})
