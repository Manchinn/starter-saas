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
      const [subscription, plan, usage, request] = await Promise.all([
        billing.getSubscription(organizationId),
        billing.getEffectivePlan(organizationId),
        billing.getUsage(organizationId),
        billing.getPendingRequest(organizationId),
      ])
      return ok(res, { subscription, plan, usage, request, canManage: isBillingOwner(req.user) })
    } catch { return serverError(res) }
  },
  async myInvoices(req, res) {
    try { return ok(res, { invoices: await billing.listInvoices(organizationIdOf(req.user)) }) } catch { return serverError(res) }
  },
  // Tenant plan request — replaces direct self-service activation. The request
  // stays pending until an admin approves it.
  async requestPlanChange(req, res) {
    if (!isBillingOwner(req.user)) return fail(res, 'Only the organization owner can request a plan change', 403)
    try {
      const request = await billing.requestPlanChange(
        organizationIdOf(req.user),
        req.body.planId,
        { note: req.body.note },
      )
      return ok(res, { request }, 'Plan request submitted')
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
      const [subscription, invoices, request] = await Promise.all([
        billing.getSubscriptionDetail(organizationId),
        billing.listInvoices(organizationId),
        billing.getPendingRequest(organizationId),
      ])
      if (!subscription) return fail(res, 'Subscription not found', 404)
      return ok(res, { subscription, invoices, request })
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
  async adminListPlanRequests(req, res) {
    try {
      return ok(res, { requests: await billing.listPlanChangeRequests({ status: req.query.status }) })
    } catch { return serverError(res) }
  },
  async adminApprovePlanRequest(req, res) {
    try {
      const request = await billing.approvePlanChangeRequest(req.params.id, req.user.id)
      return ok(res, { request }, 'Plan request approved')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
  async adminRejectPlanRequest(req, res) {
    try {
      const request = await billing.rejectPlanChangeRequest(req.params.id, req.user.id, { note: req.body.note })
      return ok(res, { request }, 'Plan request rejected')
    } catch (err) { return fail(res, err.message, err.status || 400) }
  },
}
