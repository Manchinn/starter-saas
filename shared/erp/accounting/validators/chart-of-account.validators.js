const { body } = require('express-validator')

const writeRules = [
  body('code').trim().notEmpty().withMessage('Account code is required'),
  body('name').trim().notEmpty().withMessage('Account name is required'),
  body('accountType').trim().notEmpty().withMessage('Account type is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
]

module.exports = { writeRules }
