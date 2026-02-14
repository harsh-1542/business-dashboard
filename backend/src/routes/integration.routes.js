const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const {
  addIntegrationValidator,
  updateIntegrationValidator,
  integrationIdValidator,
  workspaceIdValidator,
} = require('../validators/integration.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { authenticateToken, requireOwner } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/integrations/google/auth/:workspaceId
 * @desc    Initiate Google OAuth Flow
 */
router.get(
  '/google/auth/:workspaceId',
  authenticateToken,
  integrationController.getGoogleAuthURL
);

/**
 * @route   GET /api/integrations/google/callback
 * @desc    Handle Google OAuth Callback
 */
router.get(
  '/google/callback',
  integrationController.handleGoogleCallback
);

/**
 * @route   POST /api/integrations/:workspaceId
 * @desc    Add integration to workspace
 * @access  Private (Owner only)
 */
router.post(
  '/:workspaceId',
  authenticateToken,
  requireOwner,
  addIntegrationValidator,
  handleValidationErrors,
  integrationController.addIntegration
);

/**
 * @route   GET /api/integrations/:workspaceId
 * @desc    Get all integrations for a workspace
 * @access  Private
 */
router.get(
  '/:workspaceId',
  authenticateToken,
  workspaceIdValidator,
  handleValidationErrors,
  integrationController.getIntegrations
);

/**
 * @route   PUT /api/integrations/:integrationId
 * @desc    Update integration
 * @access  Private (Owner only)
 */
router.put(
  '/:integrationId',
  authenticateToken,
  requireOwner,
  updateIntegrationValidator,
  handleValidationErrors,
  integrationController.updateIntegration
);

/**
 * @route   DELETE /api/integrations/:integrationId
 * @desc    Delete integration
 * @access  Private (Owner only)
 */
router.delete(
  '/:integrationId',
  authenticateToken,
  requireOwner,
  integrationIdValidator,
  handleValidationErrors,
  integrationController.deleteIntegration
);

module.exports = router;