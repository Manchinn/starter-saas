const { Router } = require('express')
const controller = require('./auth.controller')
const { authenticate } = require('../../middleware/auth')
const { validate } = require('../../middleware/validate')
const {
  loginLimiter,
  registerLimiter,
  emailLimiter,
  refreshLimiter,
  tokenLimiter,
  impersonationLimiter,
} = require('../../middleware/security')
const {
  registerRules,
  loginRules,
  changePasswordRules,
  emailOnlyRules,
  resetPasswordRules,
  installRules,
} = require('./auth.validators')

const router = Router()

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

router.post('/login-as/:userId', authenticate, impersonationLimiter, (req, res) => controller.loginAs(req, res))

router.post('/install', installRules, validate, (req, res) => controller.install(req, res))

module.exports = router
