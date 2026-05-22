const { body } = require('express-validator')

const writeRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
]

module.exports = { writeRules }
