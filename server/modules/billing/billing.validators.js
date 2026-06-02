const { body } = require('express-validator')

const subscribeRules = [
  body('planId').isUUID().withMessage('A valid planId is required'),
]

const planRules = [
  body('slug').isString().trim().notEmpty().withMessage('Slug is required')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug may contain only lowercase letters, numbers and hyphens'),
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be ≥ 0'),
  body('interval').optional().isIn(['month', 'year']).withMessage('Interval must be month or year'),
  body('trialDays').optional().isInt({ min: 0 }).withMessage('Trial days must be ≥ 0'),
  body('features').optional().isObject().withMessage('features must be an object'),
  body('limits').optional().isObject().withMessage('limits must be an object'),
]

// On update every field is optional (PATCH-like), so drop the required checks.
const planUpdateRules = [
  body('slug').optional().matches(/^[a-z0-9-]+$/).withMessage('Slug may contain only lowercase letters, numbers and hyphens'),
  body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be ≥ 0'),
  body('interval').optional().isIn(['month', 'year']).withMessage('Interval must be month or year'),
  body('trialDays').optional().isInt({ min: 0 }).withMessage('Trial days must be ≥ 0'),
  body('features').optional().isObject().withMessage('features must be an object'),
  body('limits').optional().isObject().withMessage('limits must be an object'),
]

module.exports = { subscribeRules, planRules, planUpdateRules }
