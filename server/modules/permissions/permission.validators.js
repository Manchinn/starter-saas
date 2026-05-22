const { body } = require('express-validator')

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('slug').trim().matches(/^[a-z0-9_.]+$/).withMessage('Slug must be lowercase letters, numbers, dots, or underscores'),
]

module.exports = { createRules }
