const { body } = require('express-validator')
const { ALL_CATEGORIES } = require('../services/chart-of-account.service')

const writeRules = [
  body('code').trim().notEmpty().withMessage('Account code is required'),
  body('name').trim().notEmpty().withMessage('Account name is required'),
  body('accountType').trim().notEmpty().withMessage('Account type is required'),
  body('statementCategory').optional({ nullable: true, checkFalsy: true })
    .isIn(ALL_CATEGORIES).withMessage('Invalid statement category'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
]

module.exports = { writeRules }
