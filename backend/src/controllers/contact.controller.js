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
      // Check if contact already exists (by email ONLY - source of truth)
      let contact;
      let existingContactResult = { rows: [] };

      if (email) {
        existingContactResult = await client.query(
          `SELECT id, first_name, last_name, email, phone
           FROM contacts
           WHERE workspace_id = $1 AND email = $2
           LIMIT 1`,
          [workspaceId, email]
        );
      }

      if (existingContactResult.rows.length > 0) {
        // Contact exists - use existing
        contact = existingContactResult.rows[0];
        
        // Update contact details (e.g. phone if missing or changed, name)
        // For now, we update name and phone if provided
        await client.query(
            `UPDATE contacts 
             SET first_name = COALESCE($1, first_name), 
                 last_name = COALESCE($2, last_name), 
                 phone = COALESCE($3, phone),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [firstName, lastName, phone || null, contact.id]
        );
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
    // ... (rest of function as is, but I need to make sure I don't break the scope)
    // Actually, I am replacing a block inside the existing function, but wait.
    // The previous range was 36-58.
    // I need to be careful with indentation and closing braces.
    // The previous code block was lines 36-58 inside `transaction`.
    // I will replace that block.
    
    // BUT the prompt asks me to ADD getWorkspaceContacts too.
    // I should do it in TWO separate calls or replace a larger chunk.
    // I will replace the whole file or large chunks.
    // Let's use two chunks.
    
    // Chunk 1: Update deduplication logic.
    // Chunk 2: Add getWorkspaceContacts at the end.

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
 * Get contacts for a workspace (PRIVATE)
 */
const getWorkspaceContacts = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await query(
      `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.created_at, c.source,
              (SELECT COUNT(*) FROM conversations WHERE contact_id = c.id) as conversation_count,
              (SELECT MAX(created_at) FROM conversations WHERE contact_id = c.id) as last_interaction
       FROM contacts c
       WHERE c.workspace_id = $1
       ORDER BY c.created_at DESC`,
      [workspaceId]
    );

    res.status(200).json({
      success: true,
      data: {
        contacts: result.rows,
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
  getWorkspaceContacts,
  getContactFormConfig,
};