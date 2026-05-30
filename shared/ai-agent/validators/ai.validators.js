const { body } = require('express-validator')

const settingsRules = [
  body('provider').optional().isIn(['ollama', 'lmstudio']).withMessage('Invalid provider'),
  body('baseUrl').optional().trim().notEmpty().withMessage('Base URL is required'),
  body('model').optional().trim().notEmpty().withMessage('Model is required'),
  body('temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('Temperature must be 0–2'),
  body('enabled').optional().isBoolean().withMessage('Invalid enabled flag'),
  body('autoAction').optional().isBoolean().withMessage('Invalid autoAction flag'),
]

const chatRules = [
  body('content').trim().notEmpty().withMessage('Message is required'),
  body('conversationId').optional({ nullable: true }).isUUID().withMessage('Invalid conversation id'),
  body('lang').optional().isString().withMessage('Invalid language'),
]

module.exports = { settingsRules, chatRules }
