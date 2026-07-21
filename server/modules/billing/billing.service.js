const { Op } = require('sequelize')
const {
  Plan, Subscription, SubscriptionInvoice, UsageCounter, PlanChangeRequest, User, Invoice,
} = require('../../models')
const config = require('../../config/config')

const ACTIVE_STATUSES = ['active', 'trialing']
const activeStatuses = new Set(ACTIVE_STATUSES)
const planFields = new Set(['slug', 'name', 'description', 'price', 'currency', 'interval', 'trialDays', 'features', 'limits', 'isActive', 'isPublic', 'order'])
const planCache = new Map()
const accessCache = new Map()
const seatLocks = new Map()
const cacheTtlMs = 60 * 1000

const monthKey = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
const periodForMetric = (metric) => metric.endsWith('.monthly') ? monthKey() : 'lifetime'
const invalidate = (organizationId) => {
  if (organizationId) {
    planCache.delete(organizationId)
    accessCache.delete(organizationId)
  } else {
    planCache.clear()
    accessCache.clear()
  }
}
const addInterval = (date, interval) => {
  const result = new Date(date)
  if (interval === 'year') result.setUTCFullYear(result.getUTCFullYear() + 1)
  else result.setUTCMonth(result.getUTCMonth() + 1)
  return result
}
const isActive = (subscription) => {
  if (!subscription || !activeStatuses.has(subscription.status)) return false
  if (subscription.suspended) return false
  return !subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) >= new Date()
}

// Hard lockout decision for billing-only mode. No subscription row is NOT locked
// (pre-billing orgs still fall back to the default plan). A row locks when it is
// suspended or not in active/trialing (canceled, expired, past_due).
const isLockedOut = (sub) => {
  if (!sub) return false
  if (sub.suspended) return true
  return !ACTIVE_STATUSES.includes(sub.status)
}

async function isOrgLocked(organizationId) {
  if (!organizationId) return false
  const cached = accessCache.get(organizationId)
  if (cached && cached.expires > Date.now()) return cached.locked
  const sub = await Subscription.findOne({ where: { organizationId } })
  const locked = isLockedOut(sub)
  accessCache.set(organizationId, { locked, expires: Date.now() + cacheTtlMs })
  return locked
}

// Platform admins are always exempt so a misconfigured subscription cannot lock
// them out of the admin panel.
async function isUserLocked(user) {
  if (!user || user.role === 'admin') return false
  return isOrgLocked(user.organizationId || user.id)
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
  const cached = planCache.get(organizationId)
  if (cached?.expiresAt > Date.now()) return cached.plan
  const subscription = await getSubscription(organizationId)
  const plan = isActive(subscription) ? subscription.plan : await getDefaultPlan()
  planCache.set(organizationId, { plan, expiresAt: Date.now() + cacheTtlMs })
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
    // Subscribing reactivates the org — clear prior admin suspension so the
    // new plan actually takes effect (isActive treats suspended as inactive).
    suspended: false,
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

// One org's subscription with plan + owning org for the admin detail screen.
const getSubscriptionDetail = (organizationId) => Subscription.findOne({
  where: { organizationId },
  include: [
    { model: Plan, as: 'plan' },
    { model: User, as: 'organization', attributes: ['id', 'name', 'email', 'companyName'] },
  ],
})

// Admin override — only (re)subscribe when the plan actually changes so saves
// do not reset the period or mint a duplicate invoice.
async function adminSetSubscription(organizationId, {
  planId, status, suspended, currentPeriodStart, currentPeriodEnd,
} = {}) {
  const current = await Subscription.findOne({ where: { organizationId } })
  if (planId && (!current || current.planId !== planId)) {
    await subscribe(organizationId, planId)
  }

  const subscription = await Subscription.findOne({ where: { organizationId } })
  if (!subscription) throw { status: 404, message: 'Subscription not found' }

  const fields = {}
  if (status !== undefined) fields.status = status
  if (suspended !== undefined) fields.suspended = !!suspended
  if (currentPeriodStart !== undefined) fields.currentPeriodStart = currentPeriodStart
  if (currentPeriodEnd !== undefined) fields.currentPeriodEnd = currentPeriodEnd
  if (Object.keys(fields).length) await subscription.update(fields)
  invalidate(organizationId)
  return getSubscription(organizationId)
}

// Suspend / resume without altering lifecycle status. Suspension locks the org
// into billing-only mode via isLockedOut / isActive.
async function setSuspended(organizationId, suspended) {
  const subscription = await Subscription.findOne({ where: { organizationId } })
  if (!subscription) throw { status: 404, message: 'No subscription' }
  await subscription.update({ suspended: !!suspended })
  invalidate(organizationId)
  return getSubscription(organizationId)
}

// ── Plan-change requests (tenant requests → admin approves) ──────────────────
// Tenants can't self-activate a plan; they file a request that an admin approves
// (which activates the subscription immediately via subscribe) or rejects.
const PENDING = 'pending'
const PLAN_ATTRS = ['id', 'slug', 'name', 'price', 'currency', 'interval']

const getPlanChangeRequest = (id) => PlanChangeRequest.findByPk(id, {
  include: [
    { model: Plan, as: 'plan', attributes: PLAN_ATTRS },
    { model: User, as: 'organization', attributes: ['id', 'name', 'email'] },
  ],
})

const getPendingRequest = (organizationId) => PlanChangeRequest.findOne({
  where: { organizationId, status: PENDING },
  include: [{ model: Plan, as: 'plan', attributes: PLAN_ATTRS }],
})

// File (or update) the org's single open request.
async function requestPlanChange(organizationId, planId, { note = null } = {}) {
  const plan = await Plan.findByPk(planId)
  if (!plan || !plan.isActive) throw { status: 400, message: 'Plan not found or inactive' }
  const existing = await PlanChangeRequest.findOne({
    where: { organizationId, status: PENDING },
  })
  if (existing) {
    await existing.update({ planId, note })
    return getPlanChangeRequest(existing.id)
  }
  const req = await PlanChangeRequest.create({
    organizationId, planId, note, status: PENDING,
  })
  return getPlanChangeRequest(req.id)
}

const listPlanChangeRequests = ({ status } = {}) => PlanChangeRequest.findAll({
  where: status ? { status } : {},
  include: [
    { model: Plan, as: 'plan', attributes: PLAN_ATTRS },
    { model: User, as: 'organization', attributes: ['id', 'name', 'email'] },
  ],
  order: [['createdAt', 'DESC']],
})

async function approvePlanChangeRequest(id, adminUserId) {
  const req = await PlanChangeRequest.findByPk(id)
  if (!req) throw { status: 404, message: 'Request not found' }
  if (req.status !== PENDING) throw { status: 400, message: 'Request is not pending' }
  // Activate immediately — records a paid invoice for paid plans and clears
  // any billing-only lockout (subscribe invalidates cache + suspended flag).
  await subscribe(req.organizationId, req.planId)
  await req.update({ status: 'approved', decidedBy: adminUserId || null, decidedAt: new Date() })
  return getPlanChangeRequest(id)
}

async function rejectPlanChangeRequest(id, adminUserId, { note = null } = {}) {
  const req = await PlanChangeRequest.findByPk(id)
  if (!req) throw { status: 404, message: 'Request not found' }
  if (req.status !== PENDING) throw { status: 400, message: 'Request is not pending' }
  await req.update({
    status: 'rejected',
    decidedBy: adminUserId || null,
    decidedAt: new Date(),
    decisionNote: note,
  })
  return getPlanChangeRequest(id)
}

module.exports = {
  getDefaultPlan, getSubscription, getEffectivePlan, isActive,
  isLockedOut, isOrgLocked, isUserLocked,
  checkLimit, hasFeature, increment, assertSeatAvailable, getUsage, periodForMetric,
  subscribe, ensureDefaultSubscription, cancel,
  listPlans, listPublicPlans, getPlan, createPlan, updatePlan, deletePlan,
  listInvoices, listSubscriptions, getSubscriptionDetail, adminSetSubscription, setSuspended,
  requestPlanChange, getPendingRequest, listPlanChangeRequests,
  approvePlanChangeRequest, rejectPlanChangeRequest,
  withSeatLock, _invalidate: invalidate,
}
