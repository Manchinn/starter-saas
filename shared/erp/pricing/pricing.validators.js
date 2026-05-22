const { body } = require('express-validator')

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('currency').optional().isLength({ min: 3, max: 10 }).withMessage('Invalid currency'),
  body('saleItemId').optional({ nullable: true }),
]

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('saleItemId').optional({ nullable: true }),
]

module.exports = { createRules, updateRules }
