jest.mock('../../../models', () => ({
  Plan: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  Subscription: { findOne: jest.fn(), create: jest.fn(), count: jest.fn(), findAll: jest.fn() },
  UsageCounter: { findOne: jest.fn(), findOrCreate: jest.fn() },
  SubscriptionInvoice: { create: jest.fn(), findAll: jest.fn() },
  PlanChangeRequest: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() },
  User: { count: jest.fn() },
  Invoice: { count: jest.fn() },
}))

const { Plan, Subscription, UsageCounter, PlanChangeRequest, User, Invoice } = require('../../../models')
const service = require('../billing.service')

const future = new Date(Date.now() + 30 * 86400000)
const pro = {
  id: 'pro',
  slug: 'pro',
  limits: { seats: 5, 'erp.invoices.monthly': 100 },
  features: { 'ai-agent': true },
}
const free = {
  id: 'free',
  slug: 'free',
  limits: { seats: 2, 'erp.invoices.monthly': 20 },
  features: { 'ai-agent': false },
}

beforeEach(() => {
  jest.clearAllMocks()
  service._invalidate()
})

describe('effective plan', () => {
  test('uses an active subscription before the default plan', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, plan: pro })

    await expect(service.getEffectivePlan('org-active')).resolves.toBe(pro)
  })

  test('uses the default plan when no active subscription exists', async () => {
    Subscription.findOne.mockResolvedValue(null)
    Plan.findOne.mockResolvedValue(free)

    await expect(service.getEffectivePlan('org-none')).resolves.toBe(free)
  })
})

describe('quota enforcement', () => {
  beforeEach(() => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, plan: pro })
  })

  test('allows a metered action that fits in the plan limit', async () => {
    Invoice.count.mockResolvedValue(99)

    await expect(service.checkLimit('org-1', 'erp.invoices.monthly', 1))
      .resolves.toMatchObject({ allowed: true, limit: 100, used: 99 })
  })

  test('blocks a metered action that exceeds the plan limit', async () => {
    Invoice.count.mockResolvedValue(100)

    await expect(service.checkLimit('org-1', 'erp.invoices.monthly', 1))
      .resolves.toMatchObject({ allowed: false, limit: 100, used: 100 })
    expect(Invoice.count).toHaveBeenCalled()
  })

  test('live-counts invoices this month (not UsageCounter) and excludes soft-deletes', async () => {
    Invoice.count.mockResolvedValue(12)
    await expect(service.checkLimit('org-1', 'erp.invoices.monthly', 0))
      .resolves.toMatchObject({ used: 12, limit: 100 })
    expect(Invoice.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        organizationId: 'org-1',
        dataFlag: expect.anything(),
        status: expect.anything(),
      }),
    }))
    expect(UsageCounter.findOne).not.toHaveBeenCalled()
  })

  test('counts seats from active staff instead of a usage counter', async () => {
    User.count.mockResolvedValue(5)

    await expect(service.checkLimit('org-1', 'seats', 1))
      .resolves.toMatchObject({ allowed: false, limit: 5, used: 5 })
    expect(User.count).toHaveBeenCalledWith({ where: { organizationId: 'org-1', isActive: true } })
  })
})

describe('usage and lifecycle', () => {
  test('increments a monthly usage counter', async () => {
    const row = { count: 6, increment: jest.fn().mockResolvedValue(), reload: jest.fn().mockResolvedValue() }
    UsageCounter.findOrCreate.mockResolvedValue([row, true])

    await expect(service.increment('org-1', 'erp.invoices.monthly')).resolves.toBe(6)
    expect(row.increment).toHaveBeenCalledWith('count', { by: 1 })
  })

  test('marks cancellation for the end of the current period by default', async () => {
    const subscription = { update: jest.fn().mockResolvedValue() }
    Subscription.findOne.mockResolvedValue(subscription)

    await service.cancel('org-1')

    expect(subscription.update).toHaveBeenCalledWith(expect.objectContaining({ cancelAtPeriodEnd: true }))
  })

  test('shows actual usage for an unlimited plan metric', async () => {
    Subscription.findOne.mockResolvedValue({
      status: 'active', currentPeriodEnd: future, plan: { limits: { seats: -1 } },
    })
    User.count.mockResolvedValue(7)

    await expect(service.getUsage('org-1')).resolves.toEqual([{ metric: 'seats', limit: null, used: 7 }])
  })
})

describe('plan catalog', () => {
  test('updates only supported plan fields', async () => {
    const plan = { id: 'pro', slug: 'pro', update: jest.fn().mockResolvedValue() }
    Plan.findByPk.mockResolvedValue(plan)

    await service.updatePlan('pro', { name: 'Pro Plus', price: 99, id: 'another-id', providerSecret: 'not-a-plan-field' })

    expect(plan.update).toHaveBeenCalledWith({ name: 'Pro Plus', price: 99 })
  })
})

describe('access gate', () => {
  test('isLockedOut: only active/trialing are allowed; suspended always locks', () => {
    expect(service.isLockedOut(null)).toBe(false)
    expect(service.isLockedOut({ status: 'active' })).toBe(false)
    expect(service.isLockedOut({ status: 'trialing' })).toBe(false)
    expect(service.isLockedOut({ status: 'active', suspended: true })).toBe(true)
    expect(service.isLockedOut({ status: 'canceled' })).toBe(true)
    expect(service.isLockedOut({ status: 'past_due' })).toBe(true)
    expect(service.isLockedOut({ status: 'expired' })).toBe(true)
  })

  test('isUserLocked exempts system admins without hitting the DB', async () => {
    Subscription.findOne.mockReset()
    await expect(service.isUserLocked({ role: 'admin', id: 'a1' })).resolves.toBe(false)
    expect(Subscription.findOne).not.toHaveBeenCalled()
  })

  test('isUserLocked is true when the org is locked out', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'canceled' })
    await expect(service.isUserLocked({ role: 'user', id: 'org-locked' })).resolves.toBe(true)
  })

  test('isUserLocked is false for an active subscription', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active' })
    await expect(service.isUserLocked({ role: 'user', id: 'org-ok' })).resolves.toBe(false)
  })

  test('isUserLocked uses organizationId when present (staff member)', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'past_due' })
    await expect(service.isUserLocked({ role: 'user', id: 'staff-1', organizationId: 'org-1' })).resolves.toBe(true)
    expect(Subscription.findOne).toHaveBeenCalledWith({ where: { organizationId: 'org-1' } })
  })
})

describe('suspended subscriptions', () => {
  test('a suspended subscription falls back to the default plan', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, suspended: true, plan: pro })
    Plan.findOne.mockResolvedValue(free)
    await expect(service.getEffectivePlan('org-suspended')).resolves.toBe(free)
  })

  test('setSuspended flips the flag and returns the subscription', async () => {
    const sub = { update: jest.fn().mockResolvedValue() }
    Subscription.findOne
      .mockResolvedValueOnce(sub)
      .mockResolvedValueOnce({ status: 'active', plan: pro })
    await service.setSuspended('o', true)
    expect(sub.update).toHaveBeenCalledWith({ suspended: true })
  })

  test('setSuspended throws 404 when there is no subscription', async () => {
    Subscription.findOne.mockResolvedValue(null)
    await expect(service.setSuspended('o', true)).rejects.toMatchObject({ status: 404 })
  })
})

describe('adminSetSubscription', () => {
  test('does not re-subscribe when the plan is unchanged', async () => {
    const sub = { planId: 'pro', update: jest.fn().mockResolvedValue() }
    Subscription.findOne.mockResolvedValue(sub)
    await service.adminSetSubscription('o', { planId: 'pro', status: 'past_due' })
    expect(Plan.findByPk).not.toHaveBeenCalled()
    expect(sub.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'past_due' }))
  })

  test('applies suspended and date overrides', async () => {
    const sub = { planId: 'pro', update: jest.fn().mockResolvedValue() }
    Subscription.findOne.mockResolvedValue(sub)
    await service.adminSetSubscription('o', { suspended: true, currentPeriodEnd: future })
    expect(sub.update).toHaveBeenCalledWith(expect.objectContaining({ suspended: true, currentPeriodEnd: future }))
  })

  test('blocks an admin downgrade that current usage exceeds', async () => {
    Subscription.findOne.mockResolvedValue({ planId: 'pro', update: jest.fn().mockResolvedValue() })
    Plan.findByPk.mockResolvedValue({ id: 'free', name: 'Free', isActive: true, limits: { seats: 2 } })
    User.count.mockResolvedValue(5)
    await expect(service.adminSetSubscription('o', { planId: 'free' }))
      .rejects.toMatchObject({ status: 400, code: 'USAGE_OVER_LIMIT' })
  })
})

describe('subscribe clears suspension', () => {
  test('updates existing subscription with suspended false', async () => {
    const existing = { planId: 'old', update: jest.fn().mockResolvedValue() }
    Plan.findByPk.mockResolvedValue({ id: 'pro', isActive: true, trialDays: 0, interval: 'month', price: 0, currency: 'USD' })
    Subscription.findOne
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce({ status: 'active', plan: pro })
    await service.subscribe('org-1', 'pro')
    expect(existing.update).toHaveBeenCalledWith(expect.objectContaining({ suspended: false, status: 'active' }))
  })
})

describe('plan-change requests', () => {
  test('requestPlanChange creates a pending request when none is open', async () => {
    Plan.findByPk.mockResolvedValue({ id: 'p1', slug: 'pro', isActive: true })
    PlanChangeRequest.findOne.mockResolvedValue(null)
    PlanChangeRequest.create.mockResolvedValue({ id: 'r1' })
    PlanChangeRequest.findByPk.mockResolvedValue({ id: 'r1', status: 'pending' })
    await service.requestPlanChange('org1', 'p1', { note: 'please' })
    expect(PlanChangeRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org1', planId: 'p1', status: 'pending', note: 'please' }),
    )
  })

  test('requestPlanChange reuses the existing open request', async () => {
    Plan.findByPk.mockResolvedValue({ id: 'p2', slug: 'ent', isActive: true })
    const existing = { id: 'r9', update: jest.fn().mockResolvedValue() }
    PlanChangeRequest.findOne.mockResolvedValue(existing)
    PlanChangeRequest.findByPk.mockResolvedValue({ id: 'r9' })
    await service.requestPlanChange('org1', 'p2', { note: 'switch' })
    expect(existing.update).toHaveBeenCalledWith({ planId: 'p2', note: 'switch' })
    expect(PlanChangeRequest.create).not.toHaveBeenCalled()
  })

  test('requestPlanChange rejects an inactive plan', async () => {
    Plan.findByPk.mockResolvedValue({ id: 'p3', isActive: false })
    await expect(service.requestPlanChange('org1', 'p3')).rejects.toMatchObject({ status: 400 })
  })

  test('requestPlanChange is blocked when usage exceeds the target plan limits', async () => {
    Plan.findByPk.mockResolvedValue({ id: 'p4', name: 'Free', isActive: true, limits: { seats: 2 } })
    User.count.mockResolvedValue(5) // 5 seats in use > limit of 2
    await expect(service.requestPlanChange('org1', 'p4'))
      .rejects.toMatchObject({ status: 400, code: 'USAGE_OVER_LIMIT' })
    expect(PlanChangeRequest.create).not.toHaveBeenCalled()
  })

  test('approve activates the plan (subscribe) and marks the request approved', async () => {
    const req = {
      id: 'r1', status: 'pending', organizationId: 'org1', planId: 'p1',
      update: jest.fn().mockResolvedValue(),
    }
    PlanChangeRequest.findByPk.mockResolvedValue(req)
    Plan.findByPk.mockResolvedValue({
      id: 'p1', slug: 'free', price: 0, currency: 'USD', interval: 'month', trialDays: 0, isActive: true,
    })
    Subscription.findOne.mockResolvedValue(null)
    Subscription.create.mockResolvedValue({})
    await service.approvePlanChangeRequest('r1', 'admin1')
    expect(Subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org1', planId: 'p1' }),
    )
    expect(req.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved', decidedBy: 'admin1' }),
    )
  })

  test('approve refuses a non-pending request', async () => {
    PlanChangeRequest.findByPk.mockResolvedValue({ id: 'r1', status: 'approved' })
    await expect(service.approvePlanChangeRequest('r1', 'admin1')).rejects.toMatchObject({ status: 400 })
  })

  test('reject marks the request rejected with a note', async () => {
    const req = { id: 'r2', status: 'pending', update: jest.fn().mockResolvedValue() }
    PlanChangeRequest.findByPk.mockResolvedValue(req)
    await service.rejectPlanChangeRequest('r2', 'admin1', { note: 'nope' })
    expect(req.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'rejected', decisionNote: 'nope', decidedBy: 'admin1' }),
    )
  })
})
