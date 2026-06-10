const { ok, created, fail, serverError } = require('../../core/response')
const service = require('./billing.service')
const { orgKeyOf } = require('../../middleware/plan')
const { getProvider } = require('./providers')

// A staff user borrows their org's plan but must not change billing — only the
// org-owner account (a top-level User) or a system admin may mutate it.
const isBillingOwner = (req) => req.user?.role === 'admin' || !req.user?.organizationId

module.exports = {
  // ── Self-service ──────────────────────────────────────────────────────────
  async listPlans(req, res) {
    try {
      return ok(res, { plans: await service.listPublicPlans() })
    } catch (err) {
      return serverError(res)
    }
  },

  // Current org's subscription + effective plan + usage summary in one call.
  async mySubscription(req, res) {
    try {
      const orgId = orgKeyOf(req)
      const [subscription, plan, usage, request] = await Promise.all([
        service.getSubscription(orgId),
        service.getEffectivePlan(orgId),
        service.getUsage(orgId),
        service.getPendingRequest(orgId),
      ])
      return ok(res, { subscription, plan, usage, request, canManage: isBillingOwner(req) })
    } catch (err) {
      return serverError(res)
    }
  },

  async myInvoices(req, res) {
    try {
      return ok(res, { invoices: await service.listInvoices(orgKeyOf(req)) })
    } catch (err) {
      return serverError(res)
    }
  },

  // Tenant plan request — replaces direct self-service activation. The request
  // stays pending until an admin approves it (see admin endpoints below).
  async requestPlanChange(req, res) {
    try {
      if (!isBillingOwner(req)) return fail(res, 'Only the organization owner can request a plan change', 403)
      const request = await service.requestPlanChange(orgKeyOf(req), req.body.planId, { note: req.body.note })
      return ok(res, { request }, 'Plan request submitted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async cancel(req, res) {
    try {
      if (!isBillingOwner(req)) return fail(res, 'Only the organization owner can cancel the plan', 403)
      const atPeriodEnd = req.body?.immediate !== true
      const subscription = await service.cancel(orgKeyOf(req), { atPeriodEnd })
      return ok(res, { subscription }, 'Subscription canceled')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  // ── Admin: plan catalog ─────────────────────────────────────────────────────
  async adminListPlans(req, res) {
    try {
      return ok(res, { plans: await service.listPlans({ includeInactive: true }) })
    } catch (err) {
      return serverError(res)
    }
  },

  async adminGetPlan(req, res) {
    try {
      return ok(res, { plan: await service.getPlan(req.params.id) })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async adminCreatePlan(req, res) {
    try {
      const plan = await service.createPlan(req.body)
      return created(res, { plan }, 'Plan created')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async adminUpdatePlan(req, res) {
    try {
      const plan = await service.updatePlan(req.params.id, req.body)
      return ok(res, { plan }, 'Plan updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async adminDeletePlan(req, res) {
    try {
      await service.deletePlan(req.params.id)
      return ok(res, null, 'Plan deleted')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  // ── Admin: subscriptions ────────────────────────────────────────────────────
  async adminListSubscriptions(req, res) {
    try {
      return ok(res, { subscriptions: await service.listSubscriptions() })
    } catch (err) {
      return serverError(res)
    }
  },

  // One organization's subscription + plan + owning org + billing history, for
  // the admin management screen.
  async adminGetSubscription(req, res) {
    try {
      const { orgId } = req.params
      const [subscription, invoices] = await Promise.all([
        service.getSubscriptionDetail(orgId),
        service.listInvoices(orgId),
      ])
      if (!subscription) return fail(res, 'Subscription not found', 404)
      return ok(res, { subscription, invoices })
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async adminSetSubscription(req, res) {
    try {
      const subscription = await service.adminSetSubscription(req.params.orgId, {
        planId: req.body.planId,
        status: req.body.status,
        suspended: req.body.suspended,
        currentPeriodStart: req.body.currentPeriodStart,
        currentPeriodEnd: req.body.currentPeriodEnd,
      })
      return ok(res, { subscription }, 'Subscription updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async adminSuspendSubscription(req, res) {
    try {
      const subscription = await service.setSuspended(req.params.orgId, req.body.suspended !== false)
      return ok(res, { subscription }, 'Subscription updated')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async adminCancelSubscription(req, res) {
    try {
      const atPeriodEnd = req.body?.immediate !== true
      const subscription = await service.cancel(req.params.orgId, { atPeriodEnd })
      return ok(res, { subscription }, 'Subscription canceled')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  // ── Admin: plan-change requests ─────────────────────────────────────────────
  async adminListPlanRequests(req, res) {
    try {
      return ok(res, { requests: await service.listPlanChangeRequests({ status: req.query.status }) })
    } catch (err) {
      return serverError(res)
    }
  },

  async adminApprovePlanRequest(req, res) {
    try {
      const request = await service.approvePlanChangeRequest(req.params.id, req.user.id)
      return ok(res, { request }, 'Plan request approved')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  async adminRejectPlanRequest(req, res) {
    try {
      const request = await service.rejectPlanChangeRequest(req.params.id, req.user.id, { note: req.body.note })
      return ok(res, { request }, 'Plan request rejected')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },

  // ── Gateway webhook ───────────────────────────────────────────────────────────
  // Mounted with a raw-body parser so the provider can verify the signature over
  // the exact bytes received. The scaffolded providers reject until configured.
  async webhook(req, res) {
    try {
      const provider = getProvider(req.params.provider)
      const signature = req.headers['stripe-signature'] || req.headers['x-webhook-signature']
      provider.verifyWebhook(req.body, signature)
      // A configured provider would dispatch on event.type here and sync the
      // subscription via service.adminSetSubscription / service.cancel.
      return ok(res, null, 'ok')
    } catch (err) {
      return fail(res, err.message, err.status || 400)
    }
  },
}
