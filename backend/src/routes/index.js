const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const workspaceRoutes = require('./workspace.routes');
const bookingRoutes = require('./booking.routes');
const staffRoutes = require('./staff.routes');
const contactRoutes = require('./contact.routes');
const customerBookingRoutes = require('./customer-booking.routes');
const integrationRoutes = require('./integration.routes');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareOps API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/staff', staffRoutes);
router.use('/contacts', contactRoutes);
router.use('/customer-bookings', customerBookingRoutes);
router.use('/integrations', integrationRoutes);

module.exports = router;