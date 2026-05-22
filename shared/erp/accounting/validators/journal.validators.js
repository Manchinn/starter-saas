const { body } = require('express-validator')

const writeRules = [
  body('date').notEmpty().withMessage('Date is required'),
  body('lines').isArray({ min: 2 }).withMessage('At least 2 lines are required'),
  body('lines.*.accountId').notEmpty().withMessage('Each line must have an account'),
]

module.exports = { writeRules }
