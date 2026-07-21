jest.mock('../../../models', () => ({
  Plan: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  Subscription: { findOne: jest.fn(), create: jest.fn(), count: jest.fn(), findAll: jest.fn() },
  UsageCounter: { findOne: jest.fn(), findOrCreate: jest.fn() },
  SubscriptionInvoice: { create: jest.fn(), findAll: jest.fn() },
  User: { count: jest.fn() },
  Invoice: { count: jest.fn() },
}))

const { Plan, Subscription, UsageCounter, User, Invoice } = require('../../../models')
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
