const { body } = require('express-validator')

const itemsRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Item quantity must be greater than 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be a positive number'),
]

const statusRules = [
  body('status').isIn(['draft', 'sent', 'paid', 'cancelled']).withMessage('Invalid status'),
]

// Withholding tax is optional; when supplied the rate must be a sane percentage.
const whtRules = [
  body('whtCode').optional({ checkFalsy: true }).isString().withMessage('Invalid WHT code'),
  body('whtRate').optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage('WHT rate must be between 0 and 100'),
]

module.exports = { itemsRules, statusRules, whtRules }
