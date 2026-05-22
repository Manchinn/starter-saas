const { body } = require('express-validator')

const updateRules = [
  body('name').optional().isString().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
]

module.exports = { updateRules }
