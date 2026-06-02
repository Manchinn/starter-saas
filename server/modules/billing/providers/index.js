/**
 * Billing provider registry.
 *
 * A provider abstracts *how* money moves. The `manual` provider (default) has no
 * external gateway — an admin/owner assigns plans and access changes instantly.
 * The `stripe` provider is a scaffold that activates only when Stripe keys are
 * configured; until then it reports itself disabled and the manual flow is used.
 *
 * Every provider exposes:
 *   name
 *   enabled()                               → boolean
 *   createCheckout(org, plan, urls)         → { checkoutUrl } | null  (null = activate inline)
 *   verifyWebhook(rawBody, signature)       → parsed event            (throws on bad signature)
 */
const manual = require('./manual.provider')
const stripe = require('./stripe.provider')

const providers = { manual, stripe }

const getProvider = (name) => providers[name] || providers.manual

module.exports = { getProvider, providers }
