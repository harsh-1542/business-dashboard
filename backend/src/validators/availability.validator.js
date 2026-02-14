const { body, param } = require('express-validator');

const createAvailabilityValidator = [
  body('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  body('dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)'),
  body('startTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:MM format'),
];

const availabilityIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Valid availability ID is required'),
];

const workspaceIdValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
];

module.exports = {
  createAvailabilityValidator,
  availabilityIdValidator,
  workspaceIdValidator,
};
