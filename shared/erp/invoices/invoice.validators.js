const { body } = require('express-validator')

const itemsRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Item quantity must be greater than 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be a positive number'),
]

const statusRules = [
  body('status').isIn(['draft', 'sent', 'paid', 'cancelled']).withMessage('Invalid status'),
]

module.exports = { itemsRules, statusRules }
