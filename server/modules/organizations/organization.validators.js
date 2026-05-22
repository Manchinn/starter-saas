const { body } = require('express-validator')

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Role must be admin or user'),
]

module.exports = { createRules }
