const { body, param } = require('express-validator');

const createServiceTypeValidator = [
  body('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ max: 255 })
    .withMessage('Service name must not exceed 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('durationMinutes')
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
];

const updateServiceTypeValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid service type ID is required'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Service name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Service name must not exceed 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('durationMinutes')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
];

const serviceTypeIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid service type ID is required'),
];

const workspaceIdValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
];

module.exports = {
  createServiceTypeValidator,
  updateServiceTypeValidator,
  serviceTypeIdValidator,
  workspaceIdValidator,
};
