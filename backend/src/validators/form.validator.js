const { body, param } = require('express-validator');

const createFormValidator = [
  body('workspaceId').isUUID().withMessage('Invalid workspace ID'),
  body('name').trim().notEmpty().withMessage('Form name is required'),
  body('type').optional().isIn(['contact', 'survey', 'feedback']).withMessage('Invalid form type'),
  body('fields').isArray().withMessage('Fields must be an array'),
  body('fields.*.name').isString().notEmpty().withMessage('Field name is required'),
  body('fields.*.label').isString().notEmpty().withMessage('Field label is required'),
  body('fields.*.type').isIn(['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio']).withMessage('Invalid field type'),
  body('description').optional().isString(),
  body('isActive').optional().isBoolean(),
];

const updateFormValidator = [
  param('formId').isUUID().withMessage('Invalid form ID'),
  body('name').optional().trim().notEmpty().withMessage('Form name cannot be empty'),
  body('fields').optional().isArray().withMessage('Fields must be an array'),
  body('fields.*.name').optional().isString().notEmpty(),
  body('fields.*.label').optional().isString().notEmpty(),
  body('fields.*.type').optional().isIn(['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio']),
  body('description').optional().isString(),
  body('isActive').optional().isBoolean(),
];

const formIdValidator = [
  param('formId').isUUID().withMessage('Invalid form ID'),
];

const workspaceIdValidator = [
  param('workspaceId').isUUID().withMessage('Invalid workspace ID'),
];

module.exports = {
  createFormValidator,
  updateFormValidator,
  formIdValidator,
  workspaceIdValidator,
};
