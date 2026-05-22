const { body } = require('express-validator')

const createRules = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'cheque', 'credit_card', 'other']).withMessage('Invalid payment method'),
]

const statusRules = [
  body('status').isIn(['draft', 'confirmed', 'cancelled']).withMessage('Invalid status'),
]

module.exports = { createRules, statusRules }
