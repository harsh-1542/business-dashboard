const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/user/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticateToken,
  userController.getProfile
);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticateToken,
  userController.updateProfile
);

/**
 * @route   POST /api/user/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticateToken,
  userController.changePassword
);

module.exports = router;
