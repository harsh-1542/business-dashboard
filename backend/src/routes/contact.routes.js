const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { submitContactFormValidator, workspaceIdValidator } = require('../validators/contact.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');

/**
 * @route   POST /api/contacts/submit
 * @desc    Submit contact form (creates contact and sends welcome message)
 * @access  Public
 */
router.post(
  '/submit',
  submitContactFormValidator,
  handleValidationErrors,
  contactController.submitContactForm
);

/**
 * @route   GET /api/contacts/form-config/:workspaceId
 * @desc    Get contact form configuration for a workspace
 * @access  Public
 */
router.get(
  '/form-config/:workspaceId',
  workspaceIdValidator,
  handleValidationErrors,
  contactController.getContactFormConfig
);

module.exports = router;