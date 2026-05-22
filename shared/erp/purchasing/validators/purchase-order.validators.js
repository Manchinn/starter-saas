const { body } = require('express-validator')

const writeRules = [
  body('date').notEmpty().withMessage('Date is required'),
  body('vendorId').notEmpty().withMessage('Vendor is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.qty').isNumeric().withMessage('Item quantity must be a number'),
  body('items.*.unitPrice').isNumeric().withMessage('Item unit price must be a number'),
]

module.exports = { writeRules }
