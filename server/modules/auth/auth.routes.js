const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const controller = require('./auth.controller')
const { authenticate } = require('../../middleware/auth')
const { validate } = require('../../middleware/validate')
const {
  registerRules,
  loginRules,
  changePasswordRules,
  emailOnlyRules,
  resetPasswordRules,
  installRules,
} = require('./auth.validators')

const router = Router()

// ── Rate limiters ────────────────────────────────────────────────────────────
// Loose enough not to bother real users; tight enough to slow credential
// stuffing and email-spam abuse.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts — please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many registration attempts — please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many email requests — please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Silent refresh fires on page load and whenever the access token expires, so
// this is loose — it only exists to cap a client hammering /refresh or probing
// stolen cookies, not to throttle normal use.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many token refreshes — please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Token-bearing routes (reset/verify) — the tokens are random and high-entropy,
// but rate-limit anyway to deny brute-force guessing as defence in depth.
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts — please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Impersonation switch/return — privileged admin actions; keep them modest.
const impersonationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many session switches — please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/register', registerLimiter, registerRules, validate, (req, res) => controller.register(req, res))

router.post('/login', loginLimiter, loginRules, validate, (req, res) => controller.login(req, res))

router.post('/refresh', refreshLimiter, (req, res) => controller.refresh(req, res))

router.post('/logout', (req, res) => controller.logout(req, res))

router.get('/me', authenticate, (req, res) => controller.me(req, res))

router.put('/change-password', authenticate, changePasswordRules, validate, (req, res) => controller.changePassword(req, res))

router.post('/forgot-password', emailLimiter, emailOnlyRules, validate, (req, res) => controller.forgotPassword(req, res))

router.post('/reset-password', tokenLimiter, resetPasswordRules, validate, (req, res) => controller.resetPassword(req, res))

router.get('/verify-email/:token', tokenLimiter, (req, res) => controller.verifyEmail(req, res))

router.post('/resend-verification', emailLimiter, emailOnlyRules, validate, (req, res) => controller.resendVerification(req, res))

router.get('/install-status', (req, res) => controller.installStatus(req, res))

router.post('/login-as/:userId', impersonationLimiter, authenticate, (req, res) => controller.loginAs(req, res))

router.post('/return', impersonationLimiter, authenticate, (req, res) => controller.returnToAdmin(req, res))

router.post('/install', installRules, validate, (req, res) => controller.install(req, res))

module.exports = router
