const { query } = require('../config/database');
const { getAuthUrl, getTokens, createOAuth2Client } = require('../services/gmail.service'); // Ensure correct import logic in service
const { google } = require('googleapis');

/**
 * Add integration (email or SMS) to workspace
 */
const addIntegration = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { type, provider, config } = req.body;
    const userId = req.user.id;

    // Check if workspace exists and user is the owner
    const workspaceCheck = await query(
      'SELECT id, owner_id FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (workspaceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const workspace = workspaceCheck.rows[0];

    if (workspace.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can add integrations',
      });
    }

    // Validate type
    const validTypes = ['email', 'sms', 'calendar', 'storage', 'webhook'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid integration type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Check if integration already exists
    const existingIntegration = await query(
      'SELECT id FROM integrations WHERE workspace_id = $1 AND type = $2',
      [workspaceId, type]
    );

    if (existingIntegration.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `${type} integration already exists for this workspace. Please update or delete the existing one.`,
      });
    }

    // Create integration
    const result = await query(
      `INSERT INTO integrations (workspace_id, type, provider, config)
       VALUES ($1, $2, $3, $4)
       RETURNING id, workspace_id, type, provider, is_active, created_at, updated_at`,
      [workspaceId, type, provider, JSON.stringify(config)]
    );

    const integration = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Integration added successfully',
      data: {
        integration: {
          id: integration.id,
          workspaceId: integration.workspace_id,
          type: integration.type,
          provider: integration.provider,
          isActive: integration.is_active,
          createdAt: integration.created_at,
          updatedAt: integration.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all integrations for a workspace
 */
const getIntegrations = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Check if user has access to workspace
    const accessCheck = await query(
      `SELECT w.id, w.owner_id 
       FROM workspaces w
       LEFT JOIN workspace_staff ws ON w.id = ws.workspace_id AND ws.user_id = $2
       WHERE w.id = $1 AND (w.owner_id = $2 OR ws.user_id = $2)`,
      [workspaceId, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace',
      });
    }

    // Get integrations
    const result = await query(
      `SELECT id, workspace_id, type, provider, config, is_active, created_at, updated_at
       FROM integrations
       WHERE workspace_id = $1
       ORDER BY type`,
      [workspaceId]
    );

    const integrations = result.rows.map(i => {
      // Sanitize config to only include non-sensitive data
      let sanitizedConfig = null;
      if (i.config) {
        try {
          const config = typeof i.config === 'string' ? JSON.parse(i.config) : i.config;
          // Only include email for display purposes
          if (config.email) {
            sanitizedConfig = { email: config.email };
          }
        } catch (e) {
          console.error('Error parsing config:', e);
        }
      }

      return {
        id: i.id,
        workspaceId: i.workspace_id,
        type: i.type,
        provider: i.provider,
        isActive: i.is_active,
        config: sanitizedConfig,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        integrations,
        count: integrations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update integration
 */
const updateIntegration = async (req, res, next) => {
  try {
    const { integrationId } = req.params;
    const { provider, config, isActive } = req.body;
    const userId = req.user.id;

    // Check if integration exists and user is the owner
    const integrationCheck = await query(
      `SELECT i.id, i.workspace_id, w.owner_id
       FROM integrations i
       JOIN workspaces w ON i.workspace_id = w.id
       WHERE i.id = $1`,
      [integrationId]
    );

    if (integrationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found',
      });
    }

    const integration = integrationCheck.rows[0];

    if (integration.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can update integrations',
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (provider !== undefined) {
      updates.push(`provider = $${paramCounter++}`);
      values.push(provider);
    }
    if (config !== undefined) {
      updates.push(`config = $${paramCounter++}`);
      values.push(JSON.stringify(config));
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCounter++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    values.push(integrationId);

    const result = await query(
      `UPDATE integrations
       SET ${updates.join(', ')}
       WHERE id = $${paramCounter}
       RETURNING id, workspace_id, type, provider, is_active, created_at, updated_at`,
      values
    );

    const updatedIntegration = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Integration updated successfully',
      data: {
        integration: {
          id: updatedIntegration.id,
          workspaceId: updatedIntegration.workspace_id,
          type: updatedIntegration.type,
          provider: updatedIntegration.provider,
          isActive: updatedIntegration.is_active,
          createdAt: updatedIntegration.created_at,
          updatedAt: updatedIntegration.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete integration
 */
const deleteIntegration = async (req, res, next) => {
  try {
    const { integrationId } = req.params;
    const userId = req.user.id;

    // Check if integration exists and user is the owner
    const integrationCheck = await query(
      `SELECT i.id, i.workspace_id, w.owner_id
       FROM integrations i
       JOIN workspaces w ON i.workspace_id = w.id
       WHERE i.id = $1`,
      [integrationId]
    );

    if (integrationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found',
      });
    }

    const integration = integrationCheck.rows[0];

    if (integration.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can delete integrations',
      });
    }

    // Delete integration
    await query('DELETE FROM integrations WHERE id = $1', [integrationId]);

    res.status(200).json({
      success: true,
      message: 'Integration deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate Google OAuth Flow
 */
const getGoogleAuthURL = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const workspaceCheck = await query(
      'SELECT owner_id FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (workspaceCheck.rows.length === 0) return res.status(404).json({ message: 'Workspace not found' });
    if (workspaceCheck.rows[0].owner_id !== userId) return res.status(403).json({ message: 'Unauthorized' });

    // Generate state to pass workspaceId
    const state = JSON.stringify({ workspaceId, userId });
    
    const url = getAuthUrl(state); // Service function

    res.status(200).json({ success: true, data: { url } });
  } catch (error) { next(error); }
};

/**
 * Handle Google OAuth Callback
 */
const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) return res.status(400).json({ message: 'Missing code or state' });

    const { workspaceId, userId } = JSON.parse(state);
    
    // Exchange code for tokens
    const tokens = await getTokens(code); // Service function
    
    // Get user email to store as identifier
    const oauth2Client = new google.auth.OAuth2(); // Initialize dummy to set credentials
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    // Check if integration exists
    const existing = await query(
        'SELECT id FROM integrations WHERE workspace_id = $1 AND type = $2 AND provider = $3',
        [workspaceId, 'email', 'gmail']
    );

    let result;
    if (existing.rows.length > 0) {
        // Update
        result = await query(
            `UPDATE integrations 
             SET config = $1, is_active = true, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 RETURNING *`,
            [JSON.stringify({ ...tokens, email }), existing.rows[0].id]
        );
    } else {
        // Create
        result = await query(
            `INSERT INTO integrations (workspace_id, type, provider, config)
             VALUES ($1, 'email', 'gmail', $2)
             RETURNING *`,
            [workspaceId, JSON.stringify({ ...tokens, email })]
        );
    }

    // Redirect to frontend dashboard with success query param
    // Ideally frontend URL from Env
    const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    res.redirect(`${dashboardUrl}/dashboard/integrations?gmail_connected=true`);

  } catch (error) { 
      console.error('Callback Error:', error);
      const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
      res.redirect(`${dashboardUrl}/dashboard/integrations?gmail_connected=false&error=${encodeURIComponent(error.message)}`);
  }
};

module.exports = {
  addIntegration,
  getIntegrations,
  updateIntegration,
  deleteIntegration,
  getGoogleAuthURL,
  handleGoogleCallback
};