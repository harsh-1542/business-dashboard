const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { sendWelcomeEmail } = require('../services/notification.service');

/**
 * Get all forms for a workspace
 */
const getForms = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await query(
      `SELECT * FROM forms 
       WHERE workspace_id = $1 
       ORDER BY created_at DESC`,
      [workspaceId]
    );

    res.status(200).json({
      success: true,
      data: {
        forms: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single form by ID
 */
const getForm = async (req, res, next) => {
  try {
    const { formId } = req.params;

    const result = await query(
      `SELECT * FROM forms WHERE id = $1`,
      [formId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        form: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new form
 */
const createForm = async (req, res, next) => {
  try {
    const { workspaceId, name, description, fields, linkedServiceTypeId } = req.body;

    const result = await query(
      `INSERT INTO forms (workspace_id, name, description, form_fields, linked_service_type_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [workspaceId, name, description, JSON.stringify(fields), linkedServiceTypeId || null]
    );

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: {
        form: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a form
 */
const updateForm = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const { name, description, fields, isActive, linkedServiceTypeId } = req.body;

    // Check if form exists
    const checkForm = await query('SELECT id FROM forms WHERE id = $1', [formId]);
    if (checkForm.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    if (fields !== undefined) {
      updateFields.push(`form_fields = $${paramIndex}`);
      values.push(JSON.stringify(fields));
      paramIndex++;
    }
    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }
    if (linkedServiceTypeId !== undefined) {
      updateFields.push(`linked_service_type_id = $${paramIndex}`);
      values.push(linkedServiceTypeId);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update',
      });
    }

    values.push(formId);
    const queryText = `
      UPDATE forms 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await query(queryText, values);

    res.status(200).json({
      success: true,
      message: 'Form updated successfully',
      data: {
        form: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a form
 */
const deleteForm = async (req, res, next) => {
  try {
    const { formId } = req.params;

    const result = await query(
      `DELETE FROM forms WHERE id = $1 RETURNING id`,
      [formId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Form deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public form configuration (PUBLIC)
 */
const getPublicFormConfig = async (req, res, next) => {
  try {
    const { formId } = req.params;

    // Check if formId is a valid UUID
    // Try to find form by ID first
    let formResult = await query(
      `SELECT f.*, w.business_name, w.is_active as workspace_active
       FROM forms f
       JOIN workspaces w ON f.workspace_id = w.id
       WHERE f.id = $1 AND f.is_active = true`,
      [formId]
    );

    if (formResult.rows.length > 0) {
      const form = formResult.rows[0];
      
      if (!form.workspace_active) {
         return res.status(403).json({
            success: false,
            message: 'This workspace is not currently accepting inquiries',
         });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: form.id,
          workspaceId: form.workspace_id,
          name: form.name,
          businessName: form.business_name,
          description: form.description,
          fields: form.form_fields,
        },
      });
    }

    // Fallback: Check if formId is actually a workspaceId (for backward compatibility)
    // This handles the case where PublicContactForm calls with workspaceId
    const workspaceResult = await query(
        `SELECT id, business_name, is_active FROM workspaces WHERE id = $1`,
        [formId]
    );

    if (workspaceResult.rows.length > 0) {
      const workspace = workspaceResult.rows[0];
      
      if (!workspace.is_active) {
         return res.status(403).json({
            success: false,
            message: 'This workspace is not currently accepting inquiries',
         });
      }

      // Return default contact form config
      return res.status(200).json({
        success: true,
        data: {
          id: 'default', // Virtual ID
          workspaceId: workspace.id,
          name: 'Contact Us',
          businessName: workspace.business_name,
          description: 'Send us a message and we will get back to you shortly.',
          fields: [
            { name: 'firstName', label: 'First Name', type: 'text', required: true },
            { name: 'lastName', label: 'Last Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone', type: 'tel', required: false },
            { name: 'message', label: 'Message', type: 'textarea', required: true },
          ],
        },
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Form or Workspace not found',
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Submit a public form (PUBLIC)
 */
const submitPublicForm = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const submissionData = req.body;
    
    // 1. Identify Workspace and Form
    let form = null;
    let workspaceId = null;

    // Check if real form
    const formResult = await query(
        `SELECT id, workspace_id, linked_service_type_id, form_fields FROM forms WHERE id = $1`, 
        [formId]
    );

    if (formResult.rows.length > 0) {
        form = formResult.rows[0];
        workspaceId = form.workspace_id;
    } else {
        // Check if workspaceId (backward compatibility default form)
        // In this case, req.body should have workspaceId or we infer it from param if it is one
         const workspaceResult = await query(
            `SELECT id FROM workspaces WHERE id = $1`,
            [formId]
        );
        if (workspaceResult.rows.length > 0) {
            workspaceId = workspaceResult.rows[0].id;
            // It's the default form, no specific form record
        } else {
             return res.status(404).json({ success: false, message: "Form not found" });
        }
    }

    // Fetch workspace details for email
    const workspaceInfo = await query(
        `SELECT business_name, contact_email, 
         (SELECT email FROM users WHERE id = workspaces.owner_id) as owner_email
         FROM workspaces WHERE id = $1`,
        [workspaceId]
    );
    const { business_name, owner_email } = workspaceInfo.rows[0];
    const replyToEmail = owner_email; // Use owner email for Reply-To as requested

    // 2. Create/Get Contact
    // We expect basic contact info to be present in submissionData or mapped
    // If it's a custom form, we need to know which fields map to contact info.
    // GUIDELINE: We will check standard keys: firstName, lastName, email, phone.
    const firstName = submissionData.firstName || 'Unknown';
    const lastName = submissionData.lastName || 'User';
    const email = submissionData.email || null;
    const phone = submissionData.phone || null;

    // ... logic similar to contact.controller.js ...
    
    // Start Transaction
    const result = await transaction(async (client) => {
         // a. Manage Contact
        let contact;
        const existingContactResult = await client.query(
            `SELECT id, first_name, last_name, email, phone FROM contacts 
             WHERE workspace_id = $1 AND (email = $2 OR phone = $3) LIMIT 1`,
            [workspaceId, email || 'no_email', phone || 'no_phone']
        );

        if (existingContactResult.rows.length > 0) {
            contact = existingContactResult.rows[0];
            // Fix: Update contact with the latest name from this form submission
            // This ensures the inbox reflects the actual person submitting the form
            if (firstName !== 'Unknown') {
                 await client.query(
                    `UPDATE contacts SET first_name = $1, last_name = $2, email = $3, phone = $4 WHERE id = $5`,
                    [firstName, lastName, email || contact.email, phone || contact.phone, contact.id]
                 );
                 contact.first_name = firstName;
                 contact.last_name = lastName;
                 contact.email = email || contact.email;
                 contact.phone = phone || contact.phone;
            }
        } else {
            const contactInsert = await client.query(
                `INSERT INTO contacts (workspace_id, first_name, last_name, email, phone, source)
                 VALUES ($1, $2, $3, $4, $5, 'form')
                 RETURNING id, first_name, last_name, email, phone`,
                [workspaceId, firstName, lastName, email, phone]
            );
            contact = contactInsert.rows[0];
        }

        // b. Create Conversation (Only if message is provided or it's a general inquire)
        // If it's a specific form submission, we might still want a conversation to track it.
        // Let's always create a conversation for the submission context.
          // b. Create Conversation (Start a chat or resume existing one)
          // Ensure only ONE conversation exists per contact (Chat style)
          let conversation;
          const existingConv = await client.query(
              `SELECT id FROM conversations WHERE workspace_id = $1 AND contact_id = $2 LIMIT 1`,
              [workspaceId, contact.id]
          );
  
          if (existingConv.rows.length > 0) {
              conversation = existingConv.rows[0];
              // Re-open if closed and update timestamp to bring to top
              // We also updating last_message_at so it sorts correctly in the inbox list
              await client.query(
                  `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP, last_message_at = CURRENT_TIMESTAMP, status = 'active' WHERE id = $1`,
                  [conversation.id]
              );
          } else {
               const conversationResult = await client.query(
                  `INSERT INTO conversations (workspace_id, contact_id)
                   VALUES ($1, $2)
                   RETURNING id`,
                  [workspaceId, contact.id]
                );
                conversation = conversationResult.rows[0];
          }

          // c. Log Submission
          if (form) {
              await client.query(
                  `INSERT INTO form_submissions (form_id, contact_id, submission_data, status, submitted_at)
                   VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)`,
                  [form.id, contact.id, JSON.stringify(submissionData)]
              );
              
              // Also add a message to the conversation saying "Form Submitted: [Form Name]"
              // Also add a message to the conversation from the contact
              const messageContent = submissionData.message || `Submitted form: ${form.name}`;
              await client.query(
                `INSERT INTO messages (conversation_id, sender_type, sender_id, channel, content)
                 VALUES ($1, 'contact', $2, 'system', $3)`,
                [conversation.id, contact.id, messageContent]
              );
          } else {
              // Default contact form - just add message
               const messageContent = submissionData.message || "New inquiry";
               await client.query(
                `INSERT INTO messages (conversation_id, sender_type, sender_id, channel, content)
                 VALUES ($1, 'contact', $2, 'system', $3)`,
                [conversation.id, contact.id, messageContent]
              );
          }

          return { contact, conversation };
    }); // End transaction

    const { contact } = result;
    // Send Welcome Email to the email provided in the form (prioritize over accumulated contact email)
    const emailToSend = submissionData.email;
    const nameToSend = submissionData.firstName || contact.first_name;

    if (emailToSend) {
        sendWelcomeEmail(emailToSend, nameToSend, business_name, replyToEmail)
            .catch(err => console.error('Failed to send welcome email', err));
    }

    res.status(201).json({
        success: true,
        message: 'Form submitted successfully',
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get submissions for a specific form
 */
const getFormSubmissions = async (req, res, next) => {
  try {
    const { formId } = req.params;

    const result = await query(
      `SELECT fs.*, 
              to_char(fs.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at,
              COALESCE(to_char(fs.submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), to_char(fs.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) as submitted_at,
              c.first_name, c.last_name, c.email, c.phone 
       FROM form_submissions fs
       JOIN contacts c ON fs.contact_id = c.id
       WHERE fs.form_id = $1
       ORDER BY fs.created_at DESC`,
      [formId]
    );

    res.status(200).json({
      success: true,
      data: {
        submissions: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all form submissions for a workspace
 */
const getWorkspaceSubmissions = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await query(
      `SELECT fs.*, 
              to_char(fs.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at,
              COALESCE(to_char(fs.submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), to_char(fs.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) as submitted_at,
              f.name as form_name, c.first_name, c.last_name, c.email, c.phone 
       FROM form_submissions fs
       JOIN forms f ON fs.form_id = f.id
       JOIN contacts c ON fs.contact_id = c.id
       WHERE f.workspace_id = $1
       ORDER BY fs.created_at DESC
       LIMIT 20`,
      [workspaceId]
    );

    res.status(200).json({
      success: true,
      data: {
        submissions: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createForm,
  getForms,
  getForm,
  updateForm,
  deleteForm,
  getPublicFormConfig,
  submitPublicForm,
  getFormSubmissions,
  getWorkspaceSubmissions
};
