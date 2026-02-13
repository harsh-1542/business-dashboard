const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { registerValidator, loginValidator, refreshTokenValidator } = require('../validators/auth.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new business owner
 * @access  Public
 */
router.post(
  '/register',
  registerValidator,
  handleValidationErrors,
  authController.registerOwner
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginValidator,
  handleValidationErrors,
  authController.login
);

/**
 * @route   POST /api/auth/supabase
 * @desc    Login or register user via Supabase (e.g. Google)
 * @access  Public
 */
router.post(
  '/supabase',
  authController.supabaseLogin
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  refreshTokenValidator,
  handleValidationErrors,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Public
 */
router.post(
  '/logout',
  authController.logout
);

/**
 * @route   GET /api/auth/session
 * @desc    Get current session context
 * @access  Private
 */
router.get(
  '/session',
  authenticateToken,
  authController.getSessionContext
);

module.exports = router;