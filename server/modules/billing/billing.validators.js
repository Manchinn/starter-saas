const { body } = require('express-validator')

const createPlanRules = () => [
  body('slug').isString().trim().matches(/^[a-z0-9-]+$/).withMessage('Slug may contain only lowercase letters, numbers and hyphens'),
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be zero or greater'),
  body('interval').optional().isIn(['month', 'year']).withMessage('Interval must be month or year'),
  body('trialDays').optional().isInt({ min: 0 }).withMessage('Trial days must be zero or greater'),
  body('features').optional().isObject().withMessage('Features must be an object'),
  body('limits').optional().isObject().withMessage('Limits must be an object'),
]
const planRules = createPlanRules()
const planUpdateRules = [
  body('slug').optional().isString().trim().matches(/^[a-z0-9-]+$/).withMessage('Slug may contain only lowercase letters, numbers and hyphens'),
  body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be zero or greater'),
  body('interval').optional().isIn(['month', 'year']).withMessage('Interval must be month or year'),
  body('trialDays').optional().isInt({ min: 0 }).withMessage('Trial days must be zero or greater'),
  body('features').optional().isObject().withMessage('Features must be an object'),
  body('limits').optional().isObject().withMessage('Limits must be an object'),
]
const subscriptionRules = [
  body('planId').optional().isUUID().withMessage('Plan ID must be a UUID'),
  body('status').optional().isIn(['trialing', 'active', 'past_due', 'canceled', 'expired']).withMessage('Invalid subscription status'),
  body('suspended').optional().isBoolean().withMessage('Suspended must be a boolean'),
  body('currentPeriodStart').optional({ nullable: true }).isISO8601().withMessage('Period start must be a date'),
  body('currentPeriodEnd').optional({ nullable: true }).isISO8601().withMessage('Period end must be a date'),
]
const subscribeRules = [
  body('planId').isUUID().withMessage('Plan ID must be a UUID'),
]
module.exports = { planRules, planUpdateRules, subscriptionRules, subscribeRules }
