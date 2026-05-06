const { Router } = require('express')
const { body } = require('express-validator')
const controller = require('./auth.controller')
const { authenticate } = require('../../middleware/auth')
const { validate } = require('../../middleware/validate')

const router = Router()

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
], (req, res) => controller.register(req, res))

router.post('/login', [
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

router.get('/install-status', (req, res) => controller.installStatus(req, res))

router.post('/login-as/:userId', authenticate, (req, res) => controller.loginAs(req, res))

router.post('/install', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
], (req, res) => controller.install(req, res))

module.exports = router
