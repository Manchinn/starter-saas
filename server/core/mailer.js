const nodemailer = require('nodemailer')
const config = require('../config/config')
const logger = require('./logger')

const log = logger.forLabel('mailer')

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  const { host, port, secure, user, pass } = config.smtp
  if (!host) {
    log.warn('SMTP not configured — emails will be logged to console only. Set SMTP_HOST/PORT/USER/PASS to enable real sending.')
    transporter = {
      sendMail: async (opts) => {
        log.info('[stub] would send email', { to: opts.to, subject: opts.subject })
        log.debug('[stub] body', { text: opts.text })
        return { messageId: 'stub-' + Date.now() }
      },
    }
    return transporter
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  })
  return transporter
}

async function send({ to, subject, text, html }) {
  const t = getTransporter()
  try {
    const info = await t.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html: html || text,
    })
    log.info('Email sent', { to, subject, messageId: info.messageId })
    return info
  } catch (err) {
    log.error('Email send failed', { to, subject, error: err.message })
    throw err
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

// Escape user-controlled values before interpolating into HTML email bodies so
// a crafted display name can't inject markup/links into the message.
const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function wrapHtml(title, bodyHtml) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f6f8;margin:0;padding:24px;color:#1c2434;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
    <h1 style="font-size:18px;margin:0 0 16px 0;">${title}</h1>
    ${bodyHtml}
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;">
    <p style="font-size:12px;color:#637381;margin:0;">${config.appName}</p>
  </div>
</body></html>`
}

function button(href, label) {
  return `<a href="${href}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;margin:12px 0;">${label}</a>`
}

async function sendPasswordReset({ to, name, resetUrl, expiresMinutes }) {
  const subject = `Reset your ${config.appName} password`
  const text = `Hi ${name},

Someone requested a password reset for your ${config.appName} account. Click the link below to choose a new password — it expires in ${expiresMinutes} minutes.

${resetUrl}

If you didn't request this, you can safely ignore this email.`
  const html = wrapHtml(subject, `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Someone requested a password reset for your ${config.appName} account. Click the button below to choose a new password — the link expires in ${expiresMinutes} minutes.</p>
    ${button(resetUrl, 'Reset password')}
    <p style="font-size:13px;color:#637381;">If the button doesn't work, copy and paste this URL: <br><span style="word-break:break-all;">${resetUrl}</span></p>
    <p style="font-size:13px;color:#637381;">If you didn't request this, you can safely ignore this email.</p>
  `)
  return send({ to, subject, text, html })
}

async function sendEmailVerification({ to, name, verifyUrl, expiresHours }) {
  const subject = `Verify your ${config.appName} email`
  const text = `Hi ${name},

Welcome to ${config.appName}! Please verify your email address by clicking the link below — it expires in ${expiresHours} hours.

${verifyUrl}`
  const html = wrapHtml(subject, `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Welcome to ${config.appName}! Please confirm your email address by clicking the button below. The link expires in ${expiresHours} hours.</p>
    ${button(verifyUrl, 'Verify email')}
    <p style="font-size:13px;color:#637381;">If the button doesn't work, copy and paste this URL: <br><span style="word-break:break-all;">${verifyUrl}</span></p>
  `)
  return send({ to, subject, text, html })
}

module.exports = { send, sendPasswordReset, sendEmailVerification }
