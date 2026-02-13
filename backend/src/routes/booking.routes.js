const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const {
  createServiceTypeValidator,
  updateServiceTypeValidator,
  setAvailabilityValidator,
  serviceTypeIdValidator,
  workspaceIdValidator,
} = require('../validators/booking.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { authenticateToken, requireOwner } = require('../middleware/auth.middleware');

// ============================================
// SERVICE TYPES / MEETING TYPES
// ============================================

/**
 * @route   POST /api/bookings/service-types
 * @desc    Create a new service/meeting type
 * @access  Private (Owner only)
 */
router.post(
  '/service-types',
  authenticateToken,
  requireOwner,
  createServiceTypeValidator,
  handleValidationErrors,
  bookingController.createServiceType
);

/**
 * @route   GET /api/bookings/service-types/:workspaceId
 * @desc    Get all service types for a workspace
 * @access  Private
 */
router.get(
  '/service-types/:workspaceId',
  authenticateToken,
  workspaceIdValidator,
  handleValidationErrors,
  bookingController.getServiceTypes
);

/**
 * @route   PUT /api/bookings/service-types/:serviceTypeId
 * @desc    Update a service type
 * @access  Private (Owner only)
 */
router.put(
  '/service-types/:serviceTypeId',
  authenticateToken,
  requireOwner,
  updateServiceTypeValidator,
  handleValidationErrors,
  bookingController.updateServiceType
);

/**
 * @route   DELETE /api/bookings/service-types/:serviceTypeId
 * @desc    Delete a service type
 * @access  Private (Owner only)
 */
router.delete(
  '/service-types/:serviceTypeId',
  authenticateToken,
  requireOwner,
  serviceTypeIdValidator,
  handleValidationErrors,
  bookingController.deleteServiceType
);

// ============================================
// AVAILABILITY SCHEDULES
// ============================================

/**
 * @route   POST /api/bookings/availability
 * @desc    Set availability schedules for workspace
 * @access  Private (Owner only)
 */
router.post(
  '/availability',
  authenticateToken,
  requireOwner,
  setAvailabilityValidator,
  handleValidationErrors,
  bookingController.setAvailability
);

/**
 * @route   GET /api/bookings/availability/:workspaceId
 * @desc    Get availability schedules for workspace
 * @access  Private
 */
router.get(
  '/availability/:workspaceId',
  authenticateToken,
  workspaceIdValidator,
  handleValidationErrors,
  bookingController.getAvailability
);

// ============================================
// PUBLIC BOOKING PAGE
// ============================================

/**
 * @route   GET /api/bookings/public/:workspaceId
 * @desc    Get public booking page data (no auth required)
 * @access  Public
 */
router.get(
  '/public/:workspaceId',
  workspaceIdValidator,
  handleValidationErrors,
  bookingController.getPublicBookingPage
);

module.exports = router;