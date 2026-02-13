const { body, param } = require('express-validator');

const createWorkspaceValidator = [
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ max: 255 })
    .withMessage('Business name must not exceed 255 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Timezone must not exceed 100 characters'),
  body('contactEmail')
    .trim()
    .isEmail()
    .withMessage('Valid contact email is required')
    .normalizeEmail(),
];

const updateWorkspaceValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  body('businessName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Business name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Business name must not exceed 255 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Timezone must not exceed 100 characters'),
  body('contactEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid contact email is required')
    .normalizeEmail(),
];

const workspaceIdValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
];

module.exports = {
  createWorkspaceValidator,
  updateWorkspaceValidator,
  workspaceIdValidator,
};