/**
 * Customer notify — ERP outbound messaging port.
 *
 * Callers (Sales / Accounting) compose plain text and call notifyCustomer.
 * Default implementation is a no-op. Channel adapters (e.g. LINE) install
 * themselves via setImplementation at module boot.
 *
 * Delivery is best-effort: failures must not roll back ERP transactions.
 * See ADR-0002, CONTEXT.md "Customer notify".
 */

/** @type {(args: { organizationId?: string|null, customerId?: string|null, text?: string }) => Promise<void>} */
let implementation = async () => {}

/**
 * Notify a customer by organization + customer id with plain text.
 * Default no-op when no adapter is registered.
 *
 * @param {{ organizationId?: string|null, customerId?: string|null, text?: string }} args
 * @returns {Promise<void>}
 */
async function notifyCustomer(args) {
  await implementation(args || {})
}

/**
 * Install the active delivery implementation (typically from LINE register).
 * Pass a non-function to restore the default no-op.
 *
 * @param {(args: { organizationId?: string|null, customerId?: string|null, text?: string }) => Promise<void>} [fn]
 */
function setImplementation(fn) {
  implementation = typeof fn === 'function' ? fn : async () => {}
}

/** Restore the default no-op (tests / unload). */
function resetImplementation() {
  implementation = async () => {}
}

module.exports = { notifyCustomer, setImplementation, resetImplementation }
