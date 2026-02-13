const { query } = require('../config/database');

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

    // Get integrations (without exposing sensitive config)
    const result = await query(
      `SELECT id, workspace_id, type, provider, is_active, created_at, updated_at
       FROM integrations
       WHERE workspace_id = $1
       ORDER BY type`,
      [workspaceId]
    );

    const integrations = result.rows.map(i => ({
      id: i.id,
      workspaceId: i.workspace_id,
      type: i.type,
      provider: i.provider,
      isActive: i.is_active,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    }));

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

module.exports = {
  addIntegration,
  getIntegrations,
  updateIntegration,
  deleteIntegration,
};