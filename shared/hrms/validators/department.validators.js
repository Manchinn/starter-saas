const { body } = require('express-validator')

const writeRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
]

module.exports = { writeRules }
