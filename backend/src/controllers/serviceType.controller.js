const { query } = require('../config/database');

/**
 * Create a new service type
 */
const createServiceType = async (req, res, next) => {
  try {
    const { workspaceId, name, description, durationMinutes, location } = req.body;
    const userId = req.user.id;

    // Verify user owns the workspace
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

    if (workspaceCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner can create service types',
      });
    }

    const result = await query(
      `INSERT INTO service_types (workspace_id, name, description, duration_minutes, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, workspace_id, name, description, duration_minutes, location, is_active, created_at, updated_at`,
      [workspaceId, name, description || null, durationMinutes, location || null]
    );

    const serviceType = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Service type created successfully',
      data: {
        serviceType: {
          id: serviceType.id,
          workspaceId: serviceType.workspace_id,
          name: serviceType.name,
          description: serviceType.description,
          durationMinutes: serviceType.duration_minutes,
          location: serviceType.location,
          isActive: serviceType.is_active,
          createdAt: serviceType.created_at,
          updatedAt: serviceType.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all service types for a workspace
 */
const getServiceTypesByWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await query(
      `SELECT id, workspace_id, name, description, duration_minutes, location, is_active, created_at, updated_at
       FROM service_types
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [workspaceId]
    );

    res.status(200).json({
      success: true,
      data: {
        serviceTypes: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a service type
 */
const updateServiceType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, durationMinutes, location } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const serviceCheck = await query(
      `SELECT st.id, st.workspace_id, w.owner_id
       FROM service_types st
       JOIN workspaces w ON st.workspace_id = w.id
       WHERE st.id = $1`,
      [id]
    );

    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service type not found',
      });
    }

    if (serviceCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner can update service types',
      });
    }

    const result = await query(
      `UPDATE service_types
       SET name = $1, description = $2, duration_minutes = $3, location = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, workspace_id, name, description, duration_minutes, location, is_active, created_at, updated_at`,
      [name, description || null, durationMinutes, location || null, id]
    );

    const serviceType = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Service type updated successfully',
      data: {
        serviceType: {
          id: serviceType.id,
          workspaceId: serviceType.workspace_id,
          name: serviceType.name,
          description: serviceType.description,
          durationMinutes: serviceType.duration_minutes,
          location: serviceType.location,
          isActive: serviceType.is_active,
          createdAt: serviceType.created_at,
          updatedAt: serviceType.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a service type
 */
const deleteServiceType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const serviceCheck = await query(
      `SELECT st.id, st.workspace_id, w.owner_id
       FROM service_types st
       JOIN workspaces w ON st.workspace_id = w.id
       WHERE st.id = $1`,
      [id]
    );

    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service type not found',
      });
    }

    if (serviceCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner can delete service types',
      });
    }

    await query('DELETE FROM service_types WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Service type deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createServiceType,
  getServiceTypesByWorkspace,
  updateServiceType,
  deleteServiceType,
};
