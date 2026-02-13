const { query, transaction } = require('../config/database');
const messagingService = require('../services/messaging.service');

/**
 * Submit contact form (PUBLIC - no authentication)
 * This creates a contact and sends welcome message
 */
const submitContactForm = async (req, res, next) => {
  try {
    const { workspaceId, firstName, lastName, email, phone, message } = req.body;

    // Verify workspace exists and is active
    const workspaceResult = await query(
      'SELECT id, business_name, is_active FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const workspace = workspaceResult.rows[0];

    if (!workspace.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This workspace is not currently accepting inquiries',
      });
    }

    // Create contact and conversation in a transaction
    const result = await transaction(async (client) => {
      // Check if contact already exists (by email or phone)
      let contact;
      const existingContactResult = await client.query(
        `SELECT id, first_name, last_name, email, phone
         FROM contacts
         WHERE workspace_id = $1 AND (email = $2 OR phone = $3)
         LIMIT 1`,
        [workspaceId, email || null, phone || null]
      );

      if (existingContactResult.rows.length > 0) {
        // Contact exists - use existing
        contact = existingContactResult.rows[0];
      } else {
        // Create new contact
        const contactResult = await client.query(
          `INSERT INTO contacts (workspace_id, first_name, last_name, email, phone, source)
           VALUES ($1, $2, $3, $4, $5, 'form')
           RETURNING id, first_name, last_name, email, phone`,
          [workspaceId, firstName, lastName, email || null, phone || null]
        );
        contact = contactResult.rows[0];
      }

      // Create conversation
      const conversationResult = await client.query(
        `INSERT INTO conversations (workspace_id, contact_id)
         VALUES ($1, $2)
         RETURNING id`,
        [workspaceId, contact.id]
      );
      const conversation = conversationResult.rows[0];

      // Add initial message if provided
      if (message) {
        await client.query(
          `INSERT INTO messages (conversation_id, sender_type, sender_id, channel, content)
           VALUES ($1, 'contact', $2, 'system', $3)`,
          [conversation.id, contact.id, message]
        );
      }

      return { contact, conversation };
    });

    // Send welcome message asynchronously (don't wait)
    setImmediate(async () => {
      try {
        await messagingService.sendWelcomeMessage({
          workspaceId,
          contactId: result.contact.id,
          contactEmail: email,
          contactPhone: phone,
          contactName: `${firstName} ${lastName}`,
          businessName: workspace.business_name,
        });
      } catch (error) {
        console.error('Failed to send welcome message:', error);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you shortly.',
      data: {
        contactId: result.contact.id,
        conversationId: result.conversation.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contact form configuration for a workspace (PUBLIC)
 */
const getContactFormConfig = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const workspaceResult = await query(
      `SELECT id, business_name, is_active
       FROM workspaces
       WHERE id = $1`,
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const workspace = workspaceResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        workspaceId: workspace.id,
        businessName: workspace.business_name,
        isActive: workspace.is_active,
        fields: [
          { name: 'firstName', label: 'First Name', type: 'text', required: true },
          { name: 'lastName', label: 'Last Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: false },
          { name: 'phone', label: 'Phone', type: 'tel', required: false },
          { name: 'message', label: 'Message', type: 'textarea', required: false },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContactForm,
  getContactFormConfig,
};