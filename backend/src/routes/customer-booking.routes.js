const express = require('express');
const router = express.Router();
const customerBookingController = require('../controllers/customer-booking.controller');
const {
  createPublicBookingValidator,
  updateBookingStatusValidator,
  workspaceIdValidator,
} = require('../validators/customer-booking.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/customer-bookings/create
 * @desc    Create a booking (public - no auth required)
 * @access  Public
 */
router.post(
  '/create',
  createPublicBookingValidator,
  handleValidationErrors,
  customerBookingController.createPublicBooking
);

/**
 * @route   GET /api/customer-bookings/:workspaceId
 * @desc    Get all bookings for a workspace
 * @access  Private (Owner or Staff)
 */
router.get(
  '/:workspaceId',
  authenticateToken,
  workspaceIdValidator,
  handleValidationErrors,
  customerBookingController.getWorkspaceBookings
);

/**
 * @route   PUT /api/customer-bookings/:bookingId/status
 * @desc    Update booking status
 * @access  Private (Owner or Staff)
 */
router.put(
  '/:bookingId/status',
  authenticateToken,
  updateBookingStatusValidator,
  handleValidationErrors,
  customerBookingController.updateBookingStatus
);

module.exports = router;