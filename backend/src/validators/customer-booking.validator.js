const { body, param } = require('express-validator');

const createPublicBookingValidator = [
  body('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  body('serviceTypeId')
    .isUUID()
    .withMessage('Valid service type ID is required'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required if provided')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Valid phone number is required if provided'),
  body('bookingDate')
    .isDate()
    .withMessage('Valid booking date is required (YYYY-MM-DD format)'),
  body('bookingTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage('Valid booking time is required (HH:MM:SS format)'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
];

const updateBookingStatusValidator = [
  param('bookingId')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  body('status')
    .isIn(['pending', 'confirmed', 'completed', 'no_show', 'cancelled'])
    .withMessage('Invalid status'),
];

const workspaceIdValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
];

module.exports = {
  createPublicBookingValidator,
  updateBookingStatusValidator,
  workspaceIdValidator,
};