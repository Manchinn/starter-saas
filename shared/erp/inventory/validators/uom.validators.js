const { body } = require('express-validator')

const writeRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('abbreviation').trim().notEmpty().withMessage('Abbreviation is required'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
]

module.exports = { writeRules }
