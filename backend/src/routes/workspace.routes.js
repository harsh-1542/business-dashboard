const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const { createWorkspaceValidator, updateWorkspaceValidator, workspaceIdValidator } = require('../validators/workspace.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { authenticateToken, requireOwner } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/workspaces
 * @desc    Create a new workspace
 * @access  Private (Owner only)
 */
router.post(
  '/',
  authenticateToken,
  requireOwner,
  createWorkspaceValidator,
  handleValidationErrors,
  workspaceController.createWorkspace
);

/**
 * @route   PUT /api/workspaces/:workspaceId
 * @desc    Update workspace details
 * @access  Private (Owner only)
 */
router.put(
  '/:workspaceId',
  authenticateToken,
  requireOwner,
  updateWorkspaceValidator,
  handleValidationErrors,
  workspaceController.updateWorkspace
);

/**
 * @route   POST /api/workspaces/:workspaceId/activate
 * @desc    Activate workspace
 * @access  Private (Owner only)
 */
router.post(
  '/:workspaceId/activate',
  authenticateToken,
  requireOwner,
  workspaceIdValidator,
  handleValidationErrors,
  workspaceController.activateWorkspace
);

/**
 * @route   GET /api/workspaces/:workspaceId/status
 * @desc    Get workspace status and setup progress
 * @access  Private
 */
router.get(
  '/:workspaceId/status',
  authenticateToken,
  workspaceIdValidator,
  handleValidationErrors,
  workspaceController.getWorkspaceStatus
);

module.exports = router;