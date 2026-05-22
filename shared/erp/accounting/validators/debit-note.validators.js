const { body } = require('express-validator')

const createRules = [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
]

module.exports = { createRules }
