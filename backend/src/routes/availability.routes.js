const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availability.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Create availability
router.post('/', availabilityController.createAvailability);

// Get availability by workspace
router.get('/workspace/:workspaceId', availabilityController.getAvailabilityByWorkspace);

// Delete availability
router.delete('/:id', availabilityController.deleteAvailability);

module.exports = router;
