const { Router, raw } = require('express')
const controller = require('./billing.controller')
const { authenticate } = require('../../middleware/auth')
const { requirePermission } = require('../../middleware/permission')
const { validate } = require('../../middleware/validate')
const { subscribeRules, planRules, planUpdateRules } = require('./billing.validators')

const router = Router()

// ── Gateway webhook (unauthenticated, raw body for signature verification) ──────
// Declared before `authenticate` so external callers reach it. The global JSON
// parser skips this path (see server/app.js) so the raw bytes survive.
router.post('/webhook/:provider', raw({ type: '*/*' }), (req, res) => controller.webhook(req, res))

router.use(authenticate)

// ── Self-service (any authenticated org member can read) ────────────────────────
router.get('/plans',        (req, res) => controller.listPlans(req, res))
router.get('/subscription', (req, res) => controller.mySubscription(req, res))
router.get('/invoices',     (req, res) => controller.myInvoices(req, res))
router.post('/subscribe',   subscribeRules, validate, (req, res) => controller.subscribe(req, res))
router.post('/cancel',      (req, res) => controller.cancel(req, res))

// ── Admin: plan catalog ─────────────────────────────────────────────────────────
router.get('/admin/plans',        requirePermission('billing.manage'), (req, res) => controller.adminListPlans(req, res))
router.post('/admin/plans',       requirePermission('billing.manage'), planRules, validate, (req, res) => controller.adminCreatePlan(req, res))
router.get('/admin/plans/:id',    requirePermission('billing.manage'), (req, res) => controller.adminGetPlan(req, res))
router.put('/admin/plans/:id',    requirePermission('billing.manage'), planUpdateRules, validate, (req, res) => controller.adminUpdatePlan(req, res))
router.delete('/admin/plans/:id', requirePermission('billing.manage'), (req, res) => controller.adminDeletePlan(req, res))

// ── Admin: subscriptions overview / override ──────────────────────────────────────
router.get('/admin/subscriptions',        requirePermission('billing.manage'), (req, res) => controller.adminListSubscriptions(req, res))
router.put('/admin/subscriptions/:orgId', requirePermission('billing.manage'), (req, res) => controller.adminSetSubscription(req, res))

module.exports = router
