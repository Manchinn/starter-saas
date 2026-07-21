const { ok, created, fail, serverError } = require('../../core/response')
const billing = require('./billing.service')

const organizationIdOf = (user) => user?.organizationId || user?.id
const isBillingOwner = (user) => user?.role === 'admin' || !user?.organizationId

module.exports = {
  async listPlans(req, res) {
    try { return ok(res, { plans: await billing.listPublicPlans() }) } catch { return serverError(res) }
  },
  async mySubscription(req, res) {
    try {
      const organizationId = organizationIdOf(req.user)
      const [subscription, plan, usage] = await Promise.all([
        billing.getSubscription(organizationId),
        billing.getEffectivePlan(organizationId),
        billing.getUsage(organizationId),
      ])
      return ok(res, { subscription, plan, usage, canManage: isBillingOwner(req.user) })
    } catch { return serverError(res) }
  },
  async myInvoices(req, res) {
    try { return ok(res, { invoices: await billing.listInvoices(organizationIdOf(req.user)) }) } catch { return serverError(res) }
  },
  async subscribe(req, res) {
    if (!isBillingOwner(req.user)) return fail(res, 'Only the organization owner can change the plan', 403)
    try {
      const subscription = await billing.subscribe(organizationIdOf(req.user), req.body.planId)
      return ok(res, { subscription }, 'Subscription updated')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async cancel(req, res) {
    if (!isBillingOwner(req.user)) return fail(res, 'Only the organization owner can cancel the plan', 403)
    try {
      const subscription = await billing.cancel(organizationIdOf(req.user), { atPeriodEnd: req.body?.immediate !== true })
      return ok(res, { subscription }, 'Subscription cancellation scheduled')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async adminListPlans(req, res) {
    try { return ok(res, { plans: await billing.listPlans({ includeInactive: true }) }) } catch { return serverError(res) }
  },
  async adminGetPlan(req, res) {
    try { return ok(res, { plan: await billing.getPlan(req.params.id) }) } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async adminCreatePlan(req, res) {
    try { return created(res, { plan: await billing.createPlan(req.body) }, 'Plan created') } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async adminUpdatePlan(req, res) {
    try { return ok(res, { plan: await billing.updatePlan(req.params.id, req.body) }, 'Plan updated') } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async adminDeletePlan(req, res) {
    try { await billing.deletePlan(req.params.id); return ok(res, null, 'Plan deleted') } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async adminListSubscriptions(req, res) {
    try { return ok(res, { subscriptions: await billing.listSubscriptions() }) } catch { return serverError(res) }
  },
  async adminGetSubscription(req, res) {
    try {
      const organizationId = req.params.organizationId
      const [subscription, invoices] = await Promise.all([
        billing.getSubscriptionDetail(organizationId),
        billing.listInvoices(organizationId),
      ])
      if (!subscription) return fail(res, 'Subscription not found', 404)
      return ok(res, { subscription, invoices })
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async adminSetSubscription(req, res) {
    try {
      const subscription = await billing.adminSetSubscription(req.params.organizationId, {
        planId: req.body.planId,
        status: req.body.status,
        suspended: req.body.suspended,
        currentPeriodStart: req.body.currentPeriodStart,
        currentPeriodEnd: req.body.currentPeriodEnd,
      })
      return ok(res, { subscription }, 'Subscription updated')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async adminSuspendSubscription(req, res) {
    try {
      const subscription = await billing.setSuspended(req.params.organizationId, req.body.suspended !== false)
      return ok(res, { subscription }, 'Subscription updated')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async adminCancelSubscription(req, res) {
    try {
      const subscription = await billing.cancel(req.params.organizationId, {
        atPeriodEnd: req.body?.immediate !== true,
      })
      return ok(res, { subscription }, 'Subscription canceled')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
}
