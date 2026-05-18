const { Router } = require('express')
const { body } = require('express-validator')
const rateLimit = require('express-rate-limit')
const controller = require('./auth.controller')
const { authenticate } = require('../../middleware/auth')
const { validate } = require('../../middleware/validate')

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

router.post('/register', registerLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
], (req, res) => controller.register(req, res))

router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], (req, res) => controller.login(req, res))

router.post('/refresh', (req, res) => controller.refresh(req, res))

router.post('/logout', (req, res) => controller.logout(req, res))

router.get('/me', authenticate, (req, res) => controller.me(req, res))

router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  validate,
], (req, res) => controller.changePassword(req, res))

router.post('/forgot-password', emailLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  validate,
], (req, res) => controller.forgotPassword(req, res))

router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  validate,
], (req, res) => controller.resetPassword(req, res))

router.get('/verify-email/:token', (req, res) => controller.verifyEmail(req, res))

router.post('/resend-verification', emailLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  validate,
], (req, res) => controller.resendVerification(req, res))

router.get('/install-status', (req, res) => controller.installStatus(req, res))

router.post('/login-as/:userId', authenticate, (req, res) => controller.loginAs(req, res))

router.post('/install', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
], (req, res) => controller.install(req, res))

module.exports = router
