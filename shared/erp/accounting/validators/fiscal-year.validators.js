const { body } = require('express-validator')

const createRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('endDate').notEmpty().withMessage('End date is required'),
]

module.exports = { createRules }
