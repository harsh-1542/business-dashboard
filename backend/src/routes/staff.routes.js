const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const {
  registerStaffValidator,
  addStaffToWorkspaceValidator,
  updateStaffPermissionsValidator,
  workspaceStaffValidator,
  workspaceIdValidator,
} = require('../validators/staff.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { authenticateToken, requireOwner, requireStaffOrOwner } = require('../middleware/auth.middleware');

// ============================================
// STAFF REGISTRATION
// ============================================

/**
 * @route   POST /api/staff/register
 * @desc    Register a new staff member
 * @access  Public
 */
router.post(
  '/register',
  registerStaffValidator,
  handleValidationErrors,
  staffController.registerStaff
);

// ============================================
// STAFF INVITATIONS
// ============================================

/**
 * @route   POST /api/staff/workspaces/:workspaceId/invite
 * @desc    Send staff invitation
 * @access  Private (Owner only)
 */
router.post(
  '/workspaces/:workspaceId/invite',
  authenticateToken,
  requireOwner,
  staffController.inviteStaff
);

/**
 * @route   GET /api/staff/invite/verify/:token
 * @desc    Verify invite token
 * @access  Public
 */
router.get(
  '/invite/verify/:token',
  staffController.verifyInviteToken
);

/**
 * @route   POST /api/staff/invite/accept
 * @desc    Accept staff invitation and register/login
 * @access  Public
 */
router.post(
  '/invite/accept',
  staffController.acceptInvite
);

// ============================================
// WORKSPACE STAFF MANAGEMENT
// ============================================

/**
 * @route   POST /api/staff/workspaces/:workspaceId/add
 * @desc    Add staff member to workspace with permissions
 * @access  Private (Owner only)
 */
router.post(
  '/workspaces/:workspaceId/add',
  authenticateToken,
  requireOwner,
  addStaffToWorkspaceValidator,
  handleValidationErrors,
  staffController.addStaffToWorkspace
);

/**
 * @route   PUT /api/staff/workspaces/:workspaceId/staff/:staffId/permissions
 * @desc    Update staff member permissions in workspace
 * @access  Private (Owner only)
 */
router.put(
  '/workspaces/:workspaceId/staff/:staffId/permissions',
  authenticateToken,
  requireOwner,
  updateStaffPermissionsValidator,
  handleValidationErrors,
  staffController.updateStaffPermissions
);

/**
 * @route   DELETE /api/staff/workspaces/:workspaceId/staff/:staffId
 * @desc    Remove staff member from workspace
 * @access  Private (Owner only)
 */
router.delete(
  '/workspaces/:workspaceId/staff/:staffId',
  authenticateToken,
  requireOwner,
  workspaceStaffValidator,
  handleValidationErrors,
  staffController.removeStaffFromWorkspace
);

/**
 * @route   GET /api/staff/workspaces/:workspaceId
 * @desc    Get all staff members in a workspace
 * @access  Private
 */
router.get(
  '/workspaces/:workspaceId',
  authenticateToken,
  workspaceIdValidator,
  handleValidationErrors,
  staffController.getWorkspaceStaff
);

// ============================================
// STAFF MEMBER'S OWN WORKSPACES
// ============================================

/**
 * @route   GET /api/staff/my-workspaces
 * @desc    Get all workspaces where current user is staff
 * @access  Private (Staff)
 */
router.get(
  '/my-workspaces',
  authenticateToken,
  requireStaffOrOwner,
  staffController.getStaffWorkspaces
);

module.exports = router;