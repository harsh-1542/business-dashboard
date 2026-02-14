const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { workspaceIdValidator } = require('../validators/workspace.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.get(
  '/workspace/:workspaceId',
  authenticateToken,
  workspaceIdValidator,
  handleValidationErrors,
  conversationController.getConversations
);

router.get(
  '/:conversationId/messages',
  authenticateToken,
  conversationController.getMessages
);

router.post(
  '/:conversationId/reply',
  authenticateToken,
  conversationController.replyToConversation
);

module.exports = router;
