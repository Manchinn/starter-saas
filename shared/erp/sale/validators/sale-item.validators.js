const { body } = require('express-validator')

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('code').optional({ nullable: true }),
  body('productId').optional({ nullable: true }),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
]

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('code').optional({ nullable: true }),
  body('productId').optional({ nullable: true }),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
]

module.exports = { createRules, updateRules }
