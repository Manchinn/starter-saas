const { body } = require('express-validator')

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('slug').trim().matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase letters, numbers, or hyphens'),
]

module.exports = { createRules }
