const { Op } = require('sequelize')
const { Plan, Subscription, SubscriptionInvoice, UsageCounter, User, Invoice } = require('../../models')
const config = require('../../config/config')

const activeStatuses = new Set(['active', 'trialing'])
const planFields = new Set(['slug', 'name', 'description', 'price', 'currency', 'interval', 'trialDays', 'features', 'limits', 'isActive', 'isPublic', 'order'])
const cache = new Map()
const seatLocks = new Map()
const cacheTtlMs = 60 * 1000

const monthKey = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
const periodForMetric = (metric) => metric.endsWith('.monthly') ? monthKey() : 'lifetime'
const invalidate = (organizationId) => organizationId ? cache.delete(organizationId) : cache.clear()
const addInterval = (date, interval) => {
  const result = new Date(date)
  if (interval === 'year') result.setUTCFullYear(result.getUTCFullYear() + 1)
  else result.setUTCMonth(result.getUTCMonth() + 1)
  return result
}
const isActive = (subscription) => {
  if (!subscription || !activeStatuses.has(subscription.status)) return false
  return !subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) >= new Date()
}
const isUnlimited = (limit) => limit === undefined || limit === null || Number(limit) < 0
const pickPlanFields = (data) => Object.fromEntries(Object.entries(data).filter(([key]) => planFields.has(key)))

async function withSeatLock(organizationId, task) {
  const previous = seatLocks.get(organizationId) || Promise.resolve()
  let releaseCurrent
  const current = new Promise((resolve) => { releaseCurrent = resolve })
  const queue = previous.then(() => current)
  seatLocks.set(organizationId, queue)
  await previous
  try {
    return await task()
  } finally {
    releaseCurrent()
    if (seatLocks.get(organizationId) === queue) seatLocks.delete(organizationId)
  }
}

async function getDefaultPlan() {
  const configured = await Plan.findOne({ where: { slug: config.billing.defaultPlanSlug, isActive: true } })
  return configured || Plan.findOne({ where: { isActive: true }, order: [['price', 'ASC'], ['order', 'ASC']] })
}

const getSubscription = (organizationId) => Subscription.findOne({
  where: { organizationId },
  include: [{ model: Plan, as: 'plan' }],
})

async function getEffectivePlan(organizationId) {
  const cached = cache.get(organizationId)
  if (cached?.expiresAt > Date.now()) return cached.plan
  const subscription = await getSubscription(organizationId)
  const plan = isActive(subscription) ? subscription.plan : await getDefaultPlan()
  cache.set(organizationId, { plan, expiresAt: Date.now() + cacheTtlMs })
  return plan
}

async function usedFor(organizationId, metric, period = periodForMetric(metric)) {
  if (metric === 'erp.invoices.monthly') {
    const [year, month] = period.split('-').map(Number)
    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 1))
    return Invoice.count({
      where: {
        organizationId,
        invoiceDate: { [Op.gte]: start, [Op.lt]: end },
        status: { [Op.ne]: 'cancelled' },
      },
    })
  }
  const counter = await UsageCounter.findOne({ where: { organizationId, metric, period } })
  return counter ? counter.count : 0
}

async function checkLimit(organizationId, metric, amount = 1) {
  const plan = await getEffectivePlan(organizationId)
  const limit = plan?.limits?.[metric]
  if (isUnlimited(limit)) return { allowed: true, unlimited: true, limit: null, used: null, remaining: null }
  const used = metric === 'seats'
    ? await User.count({ where: { organizationId, isActive: true } })
    : await usedFor(organizationId, metric)
  const numericLimit = Number(limit)
  return {
    allowed: used + amount <= numericLimit,
    unlimited: false,
    limit: numericLimit,
    used,
    remaining: numericLimit - used,
  }
}

const hasFeature = async (organizationId, feature) => !!(await getEffectivePlan(organizationId))?.features?.[feature]

async function increment(organizationId, metric, amount = 1) {
  const period = periodForMetric(metric)
  const [counter] = await UsageCounter.findOrCreate({
    where: { organizationId, metric, period },
    defaults: { count: 0 },
  })
  await counter.increment('count', { by: amount })
  await counter.reload()
  return counter.count
}

async function assertSeatAvailable(organizationId) {
  const quota = await checkLimit(organizationId, 'seats')
  if (!quota.allowed) {
    throw { status: 403, code: 'LIMIT_REACHED', message: `Seat limit reached (${quota.limit}). Upgrade your plan to add more team members.` }
  }
}

async function getUsage(organizationId) {
  const plan = await getEffectivePlan(organizationId)
  const limits = plan?.limits || {}
  return Promise.all(Object.keys(limits).map(async (metric) => {
    const quota = await checkLimit(organizationId, metric, 0)
    const used = metric === 'seats'
      ? await User.count({ where: { organizationId, isActive: true } })
      : await usedFor(organizationId, metric)
    return { metric, limit: quota.limit, used }
  }))
}

async function subscribe(organizationId, planId, { provider = config.billing.provider } = {}) {
  const plan = await Plan.findByPk(planId)
  if (!plan || !plan.isActive) throw { status: 400, message: 'Plan not found or inactive' }
  const now = new Date()
  const trialing = plan.trialDays > 0
  const trialEndsAt = trialing ? new Date(now.getTime() + plan.trialDays * 86400000) : null
  const periodEnd = trialing ? trialEndsAt : addInterval(now, plan.interval)
  const fields = {
    organizationId, planId: plan.id, provider,
    status: trialing ? 'trialing' : 'active',
    currentPeriodStart: now, currentPeriodEnd: periodEnd, trialEndsAt,
    cancelAtPeriodEnd: false, canceledAt: null,
  }
  const existing = await Subscription.findOne({ where: { organizationId } })
  if (existing) await existing.update(fields)
  else await Subscription.create(fields)
  if (Number(plan.price) > 0 && !trialing) {
    await SubscriptionInvoice.create({
      organizationId, planId: plan.id, amount: plan.price, currency: plan.currency,
      status: provider === 'manual' ? 'paid' : 'open', paidAt: provider === 'manual' ? now : null,
      periodStart: now, periodEnd, provider,
    })
  }
  invalidate(organizationId)
  return getSubscription(organizationId)
}

async function ensureDefaultSubscription(organizationId) {
  const existing = await Subscription.findOne({ where: { organizationId } })
  if (existing) return existing
  const plan = await getDefaultPlan()
  return plan ? subscribe(organizationId, plan.id) : null
}

async function cancel(organizationId, { atPeriodEnd = true } = {}) {
  const subscription = await Subscription.findOne({ where: { organizationId } })
  if (!subscription) throw { status: 404, message: 'No active subscription' }
  const now = new Date()
  await subscription.update(atPeriodEnd
    ? { cancelAtPeriodEnd: true, canceledAt: now }
    : { status: 'canceled', cancelAtPeriodEnd: true, canceledAt: now, currentPeriodEnd: now })
  invalidate(organizationId)
  return getSubscription(organizationId)
}

const listPlans = ({ includeInactive = false } = {}) => Plan.findAll({
  where: includeInactive ? {} : { isActive: true },
  order: [['order', 'ASC'], ['price', 'ASC']],
})
const listPublicPlans = () => Plan.findAll({ where: { isActive: true, isPublic: true }, order: [['order', 'ASC'], ['price', 'ASC']] })
async function getPlan(id) {
  const plan = await Plan.findByPk(id)
  if (!plan) throw { status: 404, message: 'Plan not found' }
  return plan
}
async function createPlan(data) {
  if (await Plan.findOne({ where: { slug: data.slug } })) throw { status: 409, message: `Plan slug "${data.slug}" already exists` }
  const plan = await Plan.create(pickPlanFields(data))
  invalidate()
  return plan
}
async function updatePlan(id, data) {
  const plan = await getPlan(id)
  if (data.slug && data.slug !== plan.slug && await Plan.findOne({ where: { slug: data.slug, id: { [Op.ne]: id } } })) {
    throw { status: 409, message: `Plan slug "${data.slug}" already exists` }
  }
  await plan.update(pickPlanFields(data))
  invalidate()
  return plan
}
async function deletePlan(id) {
  const plan = await getPlan(id)
  if (await Subscription.count({ where: { planId: id } })) throw { status: 409, message: 'Plan has subscriptions; deactivate it instead' }
  await plan.destroy()
  invalidate()
}
const listInvoices = (organizationId) => SubscriptionInvoice.findAll({
  where: { organizationId }, include: [{ model: Plan, as: 'plan', attributes: ['slug', 'name'] }], order: [['createdAt', 'DESC']],
})
const listSubscriptions = () => Subscription.findAll({
  include: [
    { model: Plan, as: 'plan', attributes: ['id', 'slug', 'name', 'price', 'currency', 'interval'] },
    { model: User, as: 'organization', attributes: ['id', 'name', 'email'] },
  ], order: [['updatedAt', 'DESC']],
})

async function adminSetSubscription(organizationId, { planId, status } = {}) {
  let subscription = await Subscription.findOne({ where: { organizationId } })
  if (planId && (!subscription || subscription.planId !== planId)) subscription = await subscribe(organizationId, planId)
  if (!subscription) throw { status: 404, message: 'Subscription not found' }
  if (status) {
    await subscription.update({ status })
    invalidate(organizationId)
  }
  return getSubscription(organizationId)
}

module.exports = {
  getDefaultPlan, getSubscription, getEffectivePlan, isActive,
  checkLimit, hasFeature, increment, assertSeatAvailable, getUsage, periodForMetric,
  subscribe, ensureDefaultSubscription, cancel,
  listPlans, listPublicPlans, getPlan, createPlan, updatePlan, deletePlan,
  listInvoices, listSubscriptions, adminSetSubscription, withSeatLock, _invalidate: invalidate,
}
