const { query } = require('../config/database');
const { sendReplyEmail } = require('../services/notification.service');

const getConversations = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await query(
      `SELECT c.id, c.workspace_id, c.contact_id, c.status, c.updated_at,
              con.first_name, con.last_name, con.email, con.phone,
              (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
              (SELECT is_read FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as is_last_message_read
       FROM conversations c
       JOIN contacts con ON c.contact_id = con.id
       WHERE c.workspace_id = $1
       ORDER BY last_message_at DESC NULLS LAST`,
      [workspaceId]
    );

    res.status(200).json({ success: true, data: { conversations: result.rows } });
  } catch (error) { next(error); }
};

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    // Mark specifically unread messages from contact as read
    await query(
      `UPDATE messages SET is_read = true WHERE conversation_id = $1 AND is_read = false AND sender_type = 'contact'`,
      [conversationId]
    );

    const result = await query(
      `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId]
    );

    res.status(200).json({ success: true, data: { messages: result.rows } });
  } catch (error) { next(error); }
};

const replyToConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // From auth middleware

    const result = await query(
      `INSERT INTO messages (conversation_id, sender_type, sender_id, channel, content, is_read)
       VALUES ($1, 'staff', $2, 'email', $3, true)
       RETURNING *`,
      [conversationId, userId, content]
    );

    // Update conversation updated_at
    await query(
      `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP, last_message_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [conversationId]
    );

    // Trigger email sending
    const details = await query(`
        SELECT con.email as contact_email, 
               w.business_name, 
               (SELECT email FROM users WHERE id = w.owner_id) as owner_email
        FROM conversations c
        JOIN contacts con ON c.contact_id = con.id
        JOIN workspaces w ON c.workspace_id = w.id
        WHERE c.id = $1
    `, [conversationId]);
    
    if (details.rows.length > 0) {
        const { contact_email, business_name, owner_email } = details.rows[0];
        if (contact_email) {
             sendReplyEmail(contact_email, content, business_name, owner_email)
                .catch(err => console.error('Failed to send reply email', err));
        }
    }

    res.status(201).json({ success: true, data: { message: result.rows[0] } });
  } catch (error) { next(error); }
};

module.exports = {
  getConversations,
  getMessages,
  replyToConversation
};
