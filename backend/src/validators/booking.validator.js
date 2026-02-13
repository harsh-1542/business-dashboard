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
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('durationMinutes')
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be between 1 and 1440 minutes (24 hours)'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required for in-person meetings')
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
];

const updateServiceTypeValidator = [
  param('serviceTypeId')
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
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be between 1 and 1440 minutes'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const setAvailabilityValidator = [
  body('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  body('schedules')
    .isArray({ min: 1 })
    .withMessage('Schedules must be a non-empty array'),
  body('schedules.*.dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  body('schedules.*.startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM:SS format'),
  body('schedules.*.endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM:SS format'),
];

const serviceTypeIdValidator = [
  param('serviceTypeId')
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
  setAvailabilityValidator,
  serviceTypeIdValidator,
  workspaceIdValidator,
};