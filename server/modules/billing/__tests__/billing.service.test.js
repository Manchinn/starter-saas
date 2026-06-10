// Unit tests for modules/billing.service — plan resolution, quota checks, seat
// enforcement, metering and the cancel lifecycle. Models are mocked so the suite
// is pure logic with no database. Run from server/ (see server/jest.config.js).

jest.mock('../../../models', () => ({
  Plan:                { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
  Subscription:        { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), count: jest.fn(), findAll: jest.fn() },
  UsageCounter:        { findOne: jest.fn(), findOrCreate: jest.fn() },
  SubscriptionInvoice: { create: jest.fn(), findAll: jest.fn() },
  User:                { count: jest.fn() },
}))

const { Plan, Subscription, UsageCounter, User } = require('../../../models')
const service = require('../billing.service')

const future = new Date(Date.now() + 30 * 86400000)
const PRO  = { id: 'pro',  slug: 'pro',  limits: { seats: 5, 'erp.invoices.monthly': 100 }, features: { 'ai-agent': true } }
const FREE = { id: 'free', slug: 'free', limits: { seats: 2, 'erp.invoices.monthly': 20 }, features: { 'ai-agent': false } }

beforeEach(() => service._invalidate())

describe('getEffectivePlan', () => {
  test('returns the subscription plan when the subscription is active', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, plan: PRO })
    await expect(service.getEffectivePlan('org-active')).resolves.toBe(PRO)
  })

  test('falls back to the default plan when there is no subscription', async () => {
    Subscription.findOne.mockResolvedValue(null)
    Plan.findOne.mockResolvedValue(FREE) // getDefaultPlan by configured slug
    await expect(service.getEffectivePlan('org-none')).resolves.toBe(FREE)
  })

  test('falls back to default when the subscription is expired', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: new Date(Date.now() - 1000), plan: PRO })
    Plan.findOne.mockResolvedValue(FREE)
    await expect(service.getEffectivePlan('org-expired')).resolves.toBe(FREE)
  })
})

describe('checkLimit', () => {
  beforeEach(() => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, plan: PRO })
  })

  test('allows when usage + amount is within the limit', async () => {
    UsageCounter.findOne.mockResolvedValue({ count: 99 })
    await expect(service.checkLimit('o', 'erp.invoices.monthly', 1))
      .resolves.toMatchObject({ allowed: true, limit: 100, used: 99 })
  })

  test('blocks when usage + amount would exceed the limit', async () => {
    UsageCounter.findOne.mockResolvedValue({ count: 100 })
    await expect(service.checkLimit('o', 'erp.invoices.monthly', 1))
      .resolves.toMatchObject({ allowed: false, used: 100 })
  })

  test('treats a -1 limit as unlimited', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, plan: { limits: { seats: -1 } } })
    await expect(service.checkLimit('o', 'seats', 1)).resolves.toMatchObject({ allowed: true, unlimited: true })
  })

  test('treats an absent limit key as unlimited', async () => {
    await expect(service.checkLimit('o', 'unknown.metric', 1)).resolves.toMatchObject({ allowed: true, unlimited: true })
  })

  test('seats use the live staff count, not the usage counter', async () => {
    User.count.mockResolvedValue(5)
    await expect(service.checkLimit('o', 'seats', 1)).resolves.toMatchObject({ allowed: false, limit: 5, used: 5 })
    expect(User.count).toHaveBeenCalledWith({ where: { organizationId: 'o' } })
  })
})

describe('assertSeatAvailable', () => {
  test('throws 403 LIMIT_REACHED when at the seat cap', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, plan: { limits: { seats: 2 } } })
    User.count.mockResolvedValue(2)
    await expect(service.assertSeatAvailable('o')).rejects.toMatchObject({ status: 403, code: 'LIMIT_REACHED' })
  })

  test('passes when a seat is free', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, plan: { limits: { seats: 5 } } })
    User.count.mockResolvedValue(2)
    await expect(service.assertSeatAvailable('o')).resolves.toBeUndefined()
  })
})

describe('increment', () => {
  test('upserts the counter and increments it', async () => {
    const row = { count: 6, increment: jest.fn().mockResolvedValue(), reload: jest.fn().mockResolvedValue() }
    UsageCounter.findOrCreate.mockResolvedValue([row, true])
    const result = await service.increment('o', 'erp.invoices.monthly', 1)
    expect(UsageCounter.findOrCreate).toHaveBeenCalled()
    expect(row.increment).toHaveBeenCalledWith('count', { by: 1 })
    expect(result).toBe(6)
  })
})

describe('hasFeature', () => {
  test('reflects the plan feature flag', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, plan: PRO })
    await expect(service.hasFeature('o', 'ai-agent')).resolves.toBe(true)
  })

  test('is false for a feature the plan does not include', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, plan: FREE })
    await expect(service.hasFeature('o', 'ai-agent')).resolves.toBe(false)
  })
})

describe('suspended subscriptions', () => {
  test('a suspended subscription falls back to the default plan', async () => {
    Subscription.findOne.mockResolvedValue({ status: 'active', currentPeriodEnd: future, suspended: true, plan: PRO })
    Plan.findOne.mockResolvedValue(FREE)
    await expect(service.getEffectivePlan('org-suspended')).resolves.toBe(FREE)
  })

  test('setSuspended flips the flag and returns the subscription', async () => {
    const sub = { update: jest.fn().mockResolvedValue() }
    Subscription.findOne.mockResolvedValue(sub)
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
    expect(Plan.findByPk).not.toHaveBeenCalled() // subscribe() would have looked the plan up
    expect(sub.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'past_due' }))
  })

  test('applies suspended and date overrides', async () => {
    const sub = { planId: 'pro', update: jest.fn().mockResolvedValue() }
    Subscription.findOne.mockResolvedValue(sub)
    await service.adminSetSubscription('o', { suspended: true, currentPeriodEnd: future })
    expect(sub.update).toHaveBeenCalledWith(expect.objectContaining({ suspended: true, currentPeriodEnd: future }))
  })
})

describe('cancel', () => {
  test('flags cancelAtPeriodEnd by default', async () => {
    const sub = { update: jest.fn().mockResolvedValue() }
    Subscription.findOne.mockResolvedValue(sub)
    await service.cancel('o')
    expect(sub.update).toHaveBeenCalledWith(expect.objectContaining({ cancelAtPeriodEnd: true }))
  })

  test('throws 404 when there is no subscription', async () => {
    Subscription.findOne.mockResolvedValue(null)
    await expect(service.cancel('o')).rejects.toMatchObject({ status: 404 })
  })
})
