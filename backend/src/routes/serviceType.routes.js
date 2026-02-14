const express = require('express');
const router = express.Router();
const serviceTypeController = require('../controllers/serviceType.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Create service type
router.post('/', serviceTypeController.createServiceType);

// Get service types by workspace
router.get('/workspace/:workspaceId', serviceTypeController.getServiceTypesByWorkspace);

// Update service type
router.put('/:id', serviceTypeController.updateServiceType);

// Delete service type
router.delete('/:id', serviceTypeController.deleteServiceType);

module.exports = router;
