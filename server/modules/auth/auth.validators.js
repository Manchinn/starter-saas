const { body } = require('express-validator')

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
]

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
]

const emailOnlyRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
]

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
]

const installRules = registerRules

module.exports = {
  registerRules,
  loginRules,
  changePasswordRules,
  emailOnlyRules,
  resetPasswordRules,
  installRules,
}
