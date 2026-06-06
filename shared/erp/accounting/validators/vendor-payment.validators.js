const { body, oneOf } = require('express-validator')

// Accept either `allocations: [{vendorBillId, amount}]` or legacy `billIds: [...]`.
const createRules = [
  body('vendorId').notEmpty().withMessage('Vendor is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  oneOf([
    body('allocations').isArray({ min: 1 }),
    body('billIds').isArray({ min: 1 }),
  ], 'Select at least one bill'),
]

module.exports = { createRules }
