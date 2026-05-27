const { body, oneOf } = require('express-validator')

// Accept either the new `allocations: [{invoiceId, amount}]` shape or the
// legacy `invoiceIds: [...]` shape. The service normalizes both.
const createRules = [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  oneOf([
    body('allocations').isArray({ min: 1 }),
    body('invoiceIds').isArray({ min: 1 }),
  ], 'Select at least one invoice'),
]

module.exports = { createRules }
