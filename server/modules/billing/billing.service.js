/**
 * Billing service — plan resolution, subscription lifecycle, usage metering and
 * quota checks. The single source of truth for "what can this org do".
 *
 * An *organization* is a top-level User (organizationId === null); every billing
 * row is keyed by that user's id. Staff users (organizationId set) inherit their
 * organization's plan — resolve the owning org id with `orgKeyOf` upstream.
 */
const { Op } = require('sequelize')
const { Plan, Subscription, UsageCounter, SubscriptionInvoice, User } = require('../../models')
const config = require('../../config/config')
const log = require('../../core/logger').forLabel('billing')

const ACTIVE_STATUSES = ['active', 'trialing']

// ── Period helpers ────────────────────────────────────────────────────────────

const monthKey = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`

// Monthly metrics reset each calendar month; everything else accumulates for life.
const periodForMetric = (metric) => (metric.endsWith('.monthly') ? monthKey() : 'lifetime')

const addInterval = (from, interval) => {
  const d = new Date(from)
  if (interval === 'year') d.setUTCFullYear(d.getUTCFullYear() + 1)
  else d.setUTCMonth(d.getUTCMonth() + 1)
  return d
}

// ── Effective-plan cache (per org, short TTL) ─────────────────────────────────
const CACHE_TTL_MS = 60 * 1000
const planCache = new Map() // orgId → { plan, expires }
const invalidate = (orgId) => { if (orgId) planCache.delete(orgId); else planCache.clear() }

// ── Plan resolution ───────────────────────────────────────────────────────────

const isActive = (sub) => {
  if (!sub || !ACTIVE_STATUSES.includes(sub.status)) return false
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) return false
  return true
}

// The plan an org falls back to with no (active) subscription.
async function getDefaultPlan() {
  const bySlug = await Plan.findOne({ where: { slug: config.billing.defaultPlanSlug, isActive: true } })
  if (bySlug) return bySlug
  return Plan.findOne({ where: { isActive: true }, order: [['price', 'ASC'], ['order', 'ASC']] })
}

async function getSubscription(orgId) {
  return Subscription.findOne({ where: { organizationId: orgId }, include: [{ model: Plan, as: 'plan' }] })
}

// The plan whose features/limits apply right now. Never null in normal operation
// (a default plan should always be seeded); returns null only on an empty catalog.
async function getEffectivePlan(orgId) {
  const cached = planCache.get(orgId)
  if (cached && cached.expires > Date.now()) return cached.plan

  const sub = await getSubscription(orgId)
  const plan = isActive(sub) ? sub.plan : await getDefaultPlan()
  planCache.set(orgId, { plan, expires: Date.now() + CACHE_TTL_MS })
  return plan
}

// ── Limits & metering ──────────────────────────────────────────────────────────

// A limit is unlimited when the key is absent, null, or negative.
const isUnlimited = (limit) => limit === undefined || limit === null || Number(limit) < 0

async function usedFor(orgId, metric, period = periodForMetric(metric)) {
  const row = await UsageCounter.findOne({ where: { organizationId: orgId, metric, period } })
  return row ? row.count : 0
}

/**
 * Evaluate a quota. For seats the live count of staff users is authoritative
 * (it can change outside the meter); all other metrics use the usage counter.
 */
async function checkLimit(orgId, metric, amount = 1) {
  const plan = await getEffectivePlan(orgId)
  const limit = plan?.limits?.[metric]
  if (isUnlimited(limit)) return { allowed: true, unlimited: true, limit: null, used: null, remaining: null }

  const used = metric === 'seats'
    ? await User.count({ where: { organizationId: orgId } })
    : await usedFor(orgId, metric)

  const remaining = Number(limit) - used
  return { allowed: used + amount <= Number(limit), unlimited: false, limit: Number(limit), used, remaining }
}

const hasFeature = async (orgId, key) => {
  const plan = await getEffectivePlan(orgId)
  return !!plan?.features?.[key]
}

// Atomic-ish increment (findOrCreate + increment). Returns the new count.
async function increment(orgId, metric, amount = 1) {
  const period = periodForMetric(metric)
  const [row] = await UsageCounter.findOrCreate({
    where: { organizationId: orgId, metric, period },
    defaults: { count: 0 },
  })
  await row.increment('count', { by: amount })
  await row.reload()
  return row.count
}

// Throws a 403 when the org is at its seat cap. Called from the staff-creation
// path so a plan downgrade can't be bypassed by adding more users.
async function assertSeatAvailable(orgId) {
  const { allowed, limit } = await checkLimit(orgId, 'seats', 1)
  if (!allowed) {
    throw {
      status: 403,
      code: 'LIMIT_REACHED',
      message: `Seat limit reached (${limit}). Upgrade your plan to add more team members.`,
    }
  }
}

// ── Usage summary (for the billing dashboard) ──────────────────────────────────

async function getUsage(orgId) {
  const plan = await getEffectivePlan(orgId)
  const limits = plan?.limits || {}
  const out = []
  for (const metric of Object.keys(limits)) {
    const { limit, used, unlimited } = await checkLimit(orgId, metric, 0)
    out.push({
      metric,
      limit: unlimited ? null : limit,
      used: metric === 'seats'
        ? await User.count({ where: { organizationId: orgId } })
        : await usedFor(orgId, metric),
    })
  }
  return out
}

// ── Subscription lifecycle ──────────────────────────────────────────────────────

// Create or switch an organization's subscription to `planId`. For the manual
// provider this takes effect immediately and records an invoice for the period.
async function subscribe(orgId, planId, { provider = config.billing.provider } = {}) {
  const plan = await Plan.findByPk(planId)
  if (!plan || !plan.isActive) throw { status: 400, message: 'Plan not found or inactive' }

  const now = new Date()
  const trialing = plan.trialDays > 0
  const trialEndsAt = trialing ? new Date(now.getTime() + plan.trialDays * 86400000) : null
  const periodStart = now
  const periodEnd = trialing ? trialEndsAt : addInterval(now, plan.interval)

  const existing = await Subscription.findOne({ where: { organizationId: orgId } })
  const fields = {
    organizationId: orgId,
    planId: plan.id,
    status: trialing ? 'trialing' : 'active',
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    trialEndsAt,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    provider,
  }
  const sub = existing ? await existing.update(fields) : await Subscription.create(fields)

  // Record a billing-history row. A free or trialing period is a zero/void
  // invoice; a paid manual plan is marked paid immediately (no gateway charge).
  if (Number(plan.price) > 0 && !trialing) {
    await SubscriptionInvoice.create({
      organizationId: orgId,
      planId: plan.id,
      amount: plan.price,
      currency: plan.currency,
      status: provider === 'manual' ? 'paid' : 'open',
      paidAt: provider === 'manual' ? now : null,
      periodStart,
      periodEnd,
      provider,
    })
  }

  invalidate(orgId)
  log.info(`Org ${orgId} subscribed to plan "${plan.slug}" (${fields.status})`)
  return getSubscription(orgId)
}

// Put a brand-new organization on the default plan. Best-effort: if the catalog
// is empty (plans not seeded yet) it simply no-ops so org creation never fails.
async function ensureDefaultSubscription(orgId) {
  const existing = await Subscription.findOne({ where: { organizationId: orgId } })
  if (existing) return existing
  const plan = await getDefaultPlan()
  if (!plan) return null
  return subscribe(orgId, plan.id)
}

// Cancel — at period end by default (keeps access until paid-through), or now.
async function cancel(orgId, { atPeriodEnd = true } = {}) {
  const sub = await Subscription.findOne({ where: { organizationId: orgId } })
  if (!sub) throw { status: 404, message: 'No active subscription' }
  if (atPeriodEnd) {
    await sub.update({ cancelAtPeriodEnd: true, canceledAt: new Date() })
  } else {
    await sub.update({ status: 'canceled', cancelAtPeriodEnd: true, canceledAt: new Date(), currentPeriodEnd: new Date() })
  }
  invalidate(orgId)
  return getSubscription(orgId)
}

// ── Admin: plan catalog CRUD ────────────────────────────────────────────────────

const listPlans = ({ includeInactive = false } = {}) =>
  Plan.findAll({ where: includeInactive ? {} : { isActive: true }, order: [['order', 'ASC'], ['price', 'ASC']] })

const listPublicPlans = () =>
  Plan.findAll({ where: { isActive: true, isPublic: true }, order: [['order', 'ASC'], ['price', 'ASC']] })

const getPlan = async (id) => {
  const plan = await Plan.findByPk(id)
  if (!plan) throw { status: 404, message: 'Plan not found' }
  return plan
}

async function createPlan(data) {
  const exists = await Plan.findOne({ where: { slug: data.slug } })
  if (exists) throw { status: 409, message: `Plan slug "${data.slug}" already exists` }
  const plan = await Plan.create(data)
  invalidate()
  return plan
}

async function updatePlan(id, data) {
  const plan = await getPlan(id)
  if (data.slug && data.slug !== plan.slug) {
    const clash = await Plan.findOne({ where: { slug: data.slug, id: { [Op.ne]: id } } })
    if (clash) throw { status: 409, message: `Plan slug "${data.slug}" already exists` }
  }
  await plan.update(data)
  invalidate()
  return plan
}

async function deletePlan(id) {
  const plan = await getPlan(id)
  const inUse = await Subscription.count({ where: { planId: id } })
  if (inUse > 0) throw { status: 409, message: 'Plan has active subscriptions — deactivate it instead' }
  await plan.destroy()
  invalidate()
}

// ── Admin: subscriptions overview ────────────────────────────────────────────────

const listSubscriptions = () =>
  Subscription.findAll({
    include: [
      { model: Plan, as: 'plan', attributes: ['id', 'slug', 'name', 'price', 'currency', 'interval'] },
      { model: User, as: 'organization', attributes: ['id', 'name', 'email'] },
    ],
    order: [['updatedAt', 'DESC']],
  })

// Admin override — assign a plan and/or force a status, bypassing trial/payment.
async function adminSetSubscription(orgId, { planId, status }) {
  if (planId) await subscribe(orgId, planId)
  if (status) {
    const sub = await Subscription.findOne({ where: { organizationId: orgId } })
    if (sub) await sub.update({ status })
    invalidate(orgId)
  }
  return getSubscription(orgId)
}

const listInvoices = (orgId) =>
  SubscriptionInvoice.findAll({
    where: { organizationId: orgId },
    include: [{ model: Plan, as: 'plan', attributes: ['slug', 'name'] }],
    order: [['createdAt', 'DESC']],
  })

module.exports = {
  // resolution
  getEffectivePlan, getSubscription, getDefaultPlan, isActive,
  // limits / metering
  checkLimit, hasFeature, increment, assertSeatAvailable, getUsage, periodForMetric,
  // lifecycle
  subscribe, cancel, ensureDefaultSubscription,
  // admin
  listPlans, listPublicPlans, getPlan, createPlan, updatePlan, deletePlan,
  listSubscriptions, adminSetSubscription, listInvoices,
  // cache (exposed for tests)
  _invalidate: invalidate,
}
