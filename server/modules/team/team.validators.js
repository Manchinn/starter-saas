const { body } = require('express-validator')

// Mirrors the auth password policy (min 8). roleIds, when present, must be an
// array of ids — the service further restricts which roles may be assigned.
const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('roleIds').optional({ nullable: true }).isArray().withMessage('roleIds must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
]

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('A valid email is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
]

const passwordRules = [
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
]

const rolesRules = [
  body('roleIds').isArray().withMessage('roleIds must be an array'),
]

module.exports = { createRules, updateRules, passwordRules, rolesRules }
