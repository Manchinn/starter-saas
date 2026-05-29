const { body } = require('express-validator')

const writeRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('scope').optional().isIn(['global', 'module', 'department']).withMessage('Invalid scope'),
  body('severity').optional().isIn(['info', 'success', 'warning', 'critical']).withMessage('Invalid severity'),
  body('moduleSlug')
    .if(body('scope').equals('module'))
    .trim().notEmpty().withMessage('Module is required for module-level alerts'),
  body('departmentId')
    .if(body('scope').equals('department'))
    .trim().notEmpty().withMessage('Department is required for department-level alerts'),
]

module.exports = { writeRules }
