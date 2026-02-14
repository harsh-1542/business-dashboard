const { body, param } = require('express-validator');

const submitContactFormValidator = [
  body('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must not exceed 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must not exceed 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required if provided')
    .normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer((value) => {
      if (!value) return value;
      // Remove all non-digit characters
      let cleaned = value.replace(/\D/g, '');
      // Handle common prefixes
      if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return cleaned.substring(1);
      }
      if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return cleaned.substring(2);
      }
      return cleaned;
    })
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message must not exceed 2000 characters'),
];

const workspaceIdValidator = [
  param('workspaceId')
    .isUUID()
    .withMessage('Valid workspace ID is required'),
];

module.exports = {
  submitContactFormValidator,
  workspaceIdValidator,
};