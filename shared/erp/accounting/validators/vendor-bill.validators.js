const { body } = require('express-validator')

const writeRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
]

const statusRules = [
  body('status').isIn(['draft', 'approved', 'paid', 'cancelled']).withMessage('Invalid status'),
]

module.exports = { writeRules, statusRules }
