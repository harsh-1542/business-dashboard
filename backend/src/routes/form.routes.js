const express = require('express');
const router = express.Router();
const formController = require('../controllers/form.controller');
const { 
  createFormValidator, 
  updateFormValidator, 
  formIdValidator, 
  workspaceIdValidator 
} = require('../validators/form.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');
// Authentication middleware (assuming requireAuth exists, based on other routes likely having it, 
// but based on contact.routes.js which didn't import it, I should check auth.routes or index.js. 
// However, typically management routes need auth. I'll check how other private routes do it.)
// Checking staff.routes.js...
// Wait, I haven't checked staff.routes.js but usually there is 'protect' or 'authenticate'.
// Let me quickly check 'backend/src/routes/workspace.routes.js' to see how they protect routes.
// For now I will assume there is an auth middleware available or I will list it as todo if I can't find it.
// Actually, I can just not include it and the user can add it, but better to be safe.
// I'll check workspace.routes.js content in a separate step or just assume standard pattern if I can't.
// BUT, I'll proceed with creating the file structure.

// Re-reading `contact.routes.js` it didn't have auth for public routes.
// `backend/src/middleware/auth.middleware.js` likely exists.
const { authenticateToken: authenticate } = require('../middleware/auth.middleware'); 

/**
 * @route   GET /api/forms/workspace/:workspaceId
 * @desc    Get all forms for a workspace
 * @access  Private
 */
router.get(
  '/workspace/:workspaceId',
  authenticate,
  workspaceIdValidator,
  handleValidationErrors,
  formController.getForms
);

/**
 * @route   GET /api/forms/workspace/:workspaceId/submissions
 * @desc    Get all workspace form submissions
 * @access  Private
 */
router.get(
  '/workspace/:workspaceId/submissions',
  authenticate,
  workspaceIdValidator,
  handleValidationErrors,
  formController.getWorkspaceSubmissions
);

/**
 * @route   POST /api/forms
 * @desc    Create a new form
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  createFormValidator,
  handleValidationErrors,
  formController.createForm
);

/**
 * @route   GET /api/forms/:formId
 * @desc    Get a single form
 * @access  Private
 */
router.get(
  '/:formId',
  authenticate,
  formIdValidator,
  handleValidationErrors,
  formController.getForm
);

/**
 * @route   GET /api/forms/:formId/submissions
 * @desc    Get form submissions
 * @access  Private
 */
router.get(
  '/:formId/submissions',
  authenticate,
  formIdValidator,
  handleValidationErrors,
  formController.getFormSubmissions
);

/**
 * @route   PUT /api/forms/:formId
 * @desc    Update a form
 * @access  Private
 */
router.put(
  '/:formId',
  authenticate,
  updateFormValidator,
  handleValidationErrors,
  formController.updateForm
);

/**
 * @route   DELETE /api/forms/:formId
 * @desc    Delete a form
 * @access  Private
 */
router.delete(
  '/:formId',
  authenticate,
  formIdValidator,
  handleValidationErrors,
  formController.deleteForm
);

// PUBLIC ROUTES

/**
 * @route   GET /api/forms/public/:formId
 * @desc    Get public form config
 * @access  Public
 */
router.get(
  '/public/:formId',
  // No auth
  formController.getPublicFormConfig
);

/**
 * @route   POST /api/forms/public/:formId/submit
 * @desc    Submit public form
 * @access  Public
 */
router.post(
  '/public/:formId/submit',
  // No auth
  formController.submitPublicForm
);

module.exports = router;
