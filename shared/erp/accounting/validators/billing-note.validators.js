const { body } = require('express-validator')

const createRules = [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('invoiceIds').isArray({ min: 1 }).withMessage('Select at least one invoice'),
]

module.exports = { createRules }
