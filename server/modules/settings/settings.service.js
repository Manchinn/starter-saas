const config = require('../../config/config')
const mailer = require('../../core/mailer')
const { updateEnv } = require('../../core/env-file')

// Keys this tab owns in .env / process.env.
const SMTP_ENV_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']

/**
 * Current email settings for the UI. The password is never returned — only a
 * boolean flag of whether one is set — so the secret can't leak to the client.
 */
function getEmailSettings() {
  const smtp = config.smtp
  return {
    host:        smtp.host,
    port:        smtp.port,
    secure:      smtp.secure,
    user:        smtp.user,
    from:        smtp.from,
    hasPassword: !!smtp.pass,
    configured:  !!smtp.host, // false → mailer runs in console-stub mode
  }
}

/**
 * Persist the email settings to .env + process.env and rebuild the mailer.
 *
 * The password is only written when a non-empty value is supplied, so saving
 * the form without re-typing the secret keeps the existing one. Clearing the
 * host is allowed — it drops the mailer back to console-stub mode.
 */
function updateEmailSettings(payload) {
  const updates = {
    SMTP_HOST:   (payload.host ?? '').trim(),
    SMTP_PORT:   String(payload.port),
    SMTP_SECURE: payload.secure ? 'true' : 'false',
    SMTP_USER:   (payload.user ?? '').trim(),
    SMTP_FROM:   (payload.from ?? '').trim(),
  }
  // Only overwrite the password when the operator typed a new one.
  if (typeof payload.pass === 'string' && payload.pass.length > 0) {
    updates.SMTP_PASS = payload.pass
  }

  updateEnv(updates)
  for (const key of Object.keys(updates)) process.env[key] = updates[key]

  // Drop the cached transporter so the next send/verify uses the new config.
  mailer.reset()

  return getEmailSettings()
}

/** Probe the SMTP connection with the currently-saved settings. */
async function testConnection() {
  try {
    return await mailer.verify()
  } catch (err) {
    throw { status: 400, message: `SMTP connection failed: ${err.message}` }
  }
}

/** Send a test email to `to` using the current settings. */
async function sendTestEmail(to) {
  const subject = `${config.appName} — test email`
  const text = `This is a test email from ${config.appName}. If you received it, your SMTP settings are working.`
  try {
    const info = await mailer.send({ to, subject, text })
    return {
      stub:      mailer.isStub(),
      messageId: info.messageId,
      message:   mailer.isStub()
        ? 'SMTP is not configured — the test email was logged to the server console (stub mode).'
        : `Test email sent to ${to}.`,
    }
  } catch (err) {
    throw { status: 400, message: `Failed to send test email: ${err.message}` }
  }
}

module.exports = { getEmailSettings, updateEmailSettings, testConnection, sendTestEmail, SMTP_ENV_KEYS }
