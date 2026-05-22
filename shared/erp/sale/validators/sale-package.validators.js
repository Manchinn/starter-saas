const { body } = require('express-validator')

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('code').optional({ nullable: true }),
  body('description').optional({ nullable: true }),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('items.*.saleItemId').optional().isUUID().withMessage('Invalid sale item ID'),
  body('items.*.quantity').optional().isNumeric().withMessage('Quantity must be a number'),
]

const updateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('code').optional({ nullable: true }),
  body('description').optional({ nullable: true }),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('items.*.saleItemId').optional().isUUID().withMessage('Invalid sale item ID'),
  body('items.*.quantity').optional().isNumeric().withMessage('Quantity must be a number'),
]

module.exports = { createRules, updateRules }
