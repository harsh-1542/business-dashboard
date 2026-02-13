const { body, param } = require('express-validator');

const registerStaffValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
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
];

const addStaffToWorkspaceValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  body('staffEmail')
    .trim()
    .isEmail()
    .withMessage('Valid staff email is required')
    .normalizeEmail(),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  body('permissions.inbox')
    .optional()
    .isBoolean()
    .withMessage('inbox permission must be a boolean'),
  body('permissions.bookings')
    .optional()
    .isBoolean()
    .withMessage('bookings permission must be a boolean'),
  body('permissions.forms')
    .optional()
    .isBoolean()
    .withMessage('forms permission must be a boolean'),
  body('permissions.inventory')
    .optional()
    .isBoolean()
    .withMessage('inventory permission must be a boolean'),
];

const updateStaffPermissionsValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  param('staffId')
    .isUUID()
    .withMessage('Valid staff ID is required'),
  body('permissions')
    .isObject()
    .withMessage('Permissions must be an object'),
  body('permissions.inbox')
    .isBoolean()
    .withMessage('inbox permission must be a boolean'),
  body('permissions.bookings')
    .isBoolean()
    .withMessage('bookings permission must be a boolean'),
  body('permissions.forms')
    .isBoolean()
    .withMessage('forms permission must be a boolean'),
  body('permissions.inventory')
    .isBoolean()
    .withMessage('inventory permission must be a boolean'),
];

const workspaceStaffValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  param('staffId')
    .isUUID()
    .withMessage('Valid staff ID is required'),
];

const workspaceIdValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
];

module.exports = {
  registerStaffValidator,
  addStaffToWorkspaceValidator,
  updateStaffPermissionsValidator,
  workspaceStaffValidator,
  workspaceIdValidator,
};