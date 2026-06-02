/**
 * Manual billing provider — no external gateway.
 *
 * Subscriptions take effect immediately when assigned; there is no checkout
 * redirect (createCheckout returns null, telling the controller to activate the
 * plan inline) and no webhook source.
 */
module.exports = {
  name: 'manual',
  enabled: () => true,
  async createCheckout() {
    return null
  },
  verifyWebhook() {
    throw { status: 400, message: 'Manual provider has no webhooks' }
  },
}
