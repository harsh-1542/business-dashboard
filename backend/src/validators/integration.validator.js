const { body, param } = require('express-validator');

const addIntegrationValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  body('type')
    .isIn(['email', 'sms', 'calendar', 'storage', 'webhook'])
    .withMessage('Invalid integration type'),
  body('provider')
    .trim()
    .notEmpty()
    .withMessage('Provider is required')
    .isLength({ max: 100 })
    .withMessage('Provider must not exceed 100 characters'),
  body('config')
    .isObject()
    .withMessage('Config must be an object'),
];

const updateIntegrationValidator = [
  param('integrationId')
    .isUUID()
    .withMessage('Valid integration ID is required'),
  body('provider')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Provider cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Provider must not exceed 100 characters'),
  body('config')
    .optional()
    .isObject()
    .withMessage('Config must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const integrationIdValidator = [
  param('integrationId')
    .isUUID()
    .withMessage('Valid integration ID is required'),
];

const workspaceIdValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
];

module.exports = {
  addIntegrationValidator,
  updateIntegrationValidator,
  integrationIdValidator,
  workspaceIdValidator,
};