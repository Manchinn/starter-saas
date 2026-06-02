/**
 * Stripe billing provider — SCAFFOLD.
 *
 * Wired into the provider registry and the webhook route, but intentionally
 * inert until real credentials are present (config.billing.stripe.*). To finish
 * the integration:
 *   1. `npm i stripe -w server`
 *   2. set STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET and BILLING_PROVIDER=stripe
 *   3. map Plan.slug → Stripe Price id (e.g. a `stripePriceId` column on Plan)
 *   4. flesh out createCheckout (stripe.checkout.sessions.create) and the
 *      webhook event handlers (checkout.session.completed,
 *      customer.subscription.updated/deleted) to call billing.service.
 *
 * Until then `enabled()` is false, so the controller falls back to assigning the
 * plan inline via the manual flow and never reaches this adapter's gateway calls.
 */
const config = require('../../../config/config')

const isConfigured = () => !!(config.billing.stripe.secretKey && config.billing.stripe.webhookSecret)

module.exports = {
  name: 'stripe',
  enabled: isConfigured,

  async createCheckout(/* org, plan, urls */) {
    if (!isConfigured()) {
      throw { status: 501, message: 'Stripe is not configured on this server' }
    }
    // TODO: const session = await stripe.checkout.sessions.create({ ... })
    //       return { checkoutUrl: session.url }
    throw { status: 501, message: 'Stripe checkout not implemented in this starter' }
  },

  // Real verification requires the Stripe SDK:
  //   stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  // which checks the HMAC signature and timestamp. We refuse to process events
  // unsigned/unconfigured rather than trust the payload.
  verifyWebhook(rawBody, signature) {
    if (!isConfigured()) throw { status: 501, message: 'Stripe is not configured on this server' }
    if (!signature) throw { status: 400, message: 'Missing Stripe-Signature header' }
    throw { status: 501, message: 'Stripe webhook verification not implemented in this starter' }
  },
}
