const { body } = require('express-validator')

const writeRules = [
  body('docType').optional().isIn(['purchase_order', 'vendor_bill']).withMessage('Invalid document type'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('requiredPermission').optional().isString().notEmpty().withMessage('Required permission is required'),
]

module.exports = { writeRules }
