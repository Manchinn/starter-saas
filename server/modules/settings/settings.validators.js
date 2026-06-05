const { body } = require('express-validator')

// Email-settings update. Host may be blank (disables sending → stub mode); when
// present the other fields are validated. `pass` is optional — omitting it
// keeps the stored password.
const emailRules = [
  body('host').optional({ nullable: true }).isString().trim(),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Port must be between 1 and 65535'),
  body('secure').isBoolean().withMessage('Secure must be true or false').toBoolean(),
  body('user').optional({ nullable: true }).isString().trim(),
  body('pass').optional({ nullable: true }).isString(),
  body('from').trim().isEmail().withMessage('From must be a valid email address'),
]

const testEmailRules = [
  body('to').trim().isEmail().withMessage('A valid recipient email is required'),
]

module.exports = { emailRules, testEmailRules }
