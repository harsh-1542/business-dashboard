const { query, transaction } = require('../config/database');

/**
 * Create a new service/meeting type
 */
const createServiceType = async (req, res, next) => {
  try {
    const { workspaceId, name, description, durationMinutes, location } = req.body;
    const userId = req.user.id;

    // Check if workspace exists and user is the owner
    const workspaceCheck = await query(
      'SELECT id, owner_id, is_active FROM workspaces WHERE id = $1',
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
        message: 'Only the workspace owner can create service types',
      });
    }

    // Create service type
    const result = await query(
      `INSERT INTO service_types (workspace_id, name, description, duration_minutes, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, workspace_id, name, description, duration_minutes, location, is_active, created_at, updated_at`,
      [workspaceId, name, description || null, durationMinutes, location]
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
const getServiceTypes = async (req, res, next) => {
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

    // Get all service types
    const result = await query(
      `SELECT id, workspace_id, name, description, duration_minutes, location, is_active, created_at, updated_at
       FROM service_types
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [workspaceId]
    );

    const serviceTypes = result.rows.map(st => ({
      id: st.id,
      workspaceId: st.workspace_id,
      name: st.name,
      description: st.description,
      durationMinutes: st.duration_minutes,
      location: st.location,
      isActive: st.is_active,
      createdAt: st.created_at,
      updatedAt: st.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        serviceTypes,
        count: serviceTypes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update service type
 */
const updateServiceType = async (req, res, next) => {
  try {
    const { serviceTypeId } = req.params;
    const { name, description, durationMinutes, location, isActive } = req.body;
    const userId = req.user.id;

    // Check if service type exists and user is the owner
    const serviceTypeCheck = await query(
      `SELECT st.id, st.workspace_id, w.owner_id
       FROM service_types st
       JOIN workspaces w ON st.workspace_id = w.id
       WHERE st.id = $1`,
      [serviceTypeId]
    );

    if (serviceTypeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service type not found',
      });
    }

    const serviceType = serviceTypeCheck.rows[0];

    if (serviceType.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can update service types',
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCounter++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCounter++}`);
      values.push(description);
    }
    if (durationMinutes !== undefined) {
      updates.push(`duration_minutes = $${paramCounter++}`);
      values.push(durationMinutes);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCounter++}`);
      values.push(location);
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

    values.push(serviceTypeId);

    const result = await query(
      `UPDATE service_types
       SET ${updates.join(', ')}
       WHERE id = $${paramCounter}
       RETURNING id, workspace_id, name, description, duration_minutes, location, is_active, created_at, updated_at`,
      values
    );

    const updatedServiceType = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Service type updated successfully',
      data: {
        serviceType: {
          id: updatedServiceType.id,
          workspaceId: updatedServiceType.workspace_id,
          name: updatedServiceType.name,
          description: updatedServiceType.description,
          durationMinutes: updatedServiceType.duration_minutes,
          location: updatedServiceType.location,
          isActive: updatedServiceType.is_active,
          createdAt: updatedServiceType.created_at,
          updatedAt: updatedServiceType.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete service type
 */
const deleteServiceType = async (req, res, next) => {
  try {
    const { serviceTypeId } = req.params;
    const userId = req.user.id;

    // Check if service type exists and user is the owner
    const serviceTypeCheck = await query(
      `SELECT st.id, st.workspace_id, w.owner_id
       FROM service_types st
       JOIN workspaces w ON st.workspace_id = w.id
       WHERE st.id = $1`,
      [serviceTypeId]
    );

    if (serviceTypeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service type not found',
      });
    }

    const serviceType = serviceTypeCheck.rows[0];

    if (serviceType.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can delete service types',
      });
    }

    // Delete service type
    await query('DELETE FROM service_types WHERE id = $1', [serviceTypeId]);

    res.status(200).json({
      success: true,
      message: 'Service type deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set availability schedule for workspace
 */
const setAvailability = async (req, res, next) => {
  try {
    const { workspaceId, schedules } = req.body;
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
        message: 'Only the workspace owner can set availability',
      });
    }

    // Validate schedules array
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedules must be a non-empty array',
      });
    }

    // Use transaction to delete old schedules and insert new ones
    const result = await transaction(async (client) => {
      // Delete existing schedules
      await client.query(
        'DELETE FROM availability_schedules WHERE workspace_id = $1',
        [workspaceId]
      );

      // Insert new schedules
      const insertedSchedules = [];
      for (const schedule of schedules) {
        const { dayOfWeek, startTime, endTime } = schedule;
        
        const result = await client.query(
          `INSERT INTO availability_schedules (workspace_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)
           RETURNING id, workspace_id, day_of_week, start_time, end_time, is_active, created_at`,
          [workspaceId, dayOfWeek, startTime, endTime]
        );
        
        insertedSchedules.push(result.rows[0]);
      }

      return insertedSchedules;
    });

    const formattedSchedules = result.map(s => ({
      id: s.id,
      workspaceId: s.workspace_id,
      dayOfWeek: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time,
      isActive: s.is_active,
      createdAt: s.created_at,
    }));

    res.status(200).json({
      success: true,
      message: 'Availability schedules set successfully',
      data: {
        schedules: formattedSchedules,
        count: formattedSchedules.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get availability schedules for workspace
 */
const getAvailability = async (req, res, next) => {
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

    // Get availability schedules
    const result = await query(
      `SELECT id, workspace_id, day_of_week, start_time, end_time, is_active, created_at
       FROM availability_schedules
       WHERE workspace_id = $1 AND is_active = true
       ORDER BY day_of_week, start_time`,
      [workspaceId]
    );

    const schedules = result.rows.map(s => ({
      id: s.id,
      workspaceId: s.workspace_id,
      dayOfWeek: s.day_of_week,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][s.day_of_week],
      startTime: s.start_time,
      endTime: s.end_time,
      isActive: s.is_active,
      createdAt: s.created_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        schedules,
        count: schedules.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public booking page data (no authentication required)
 */
const getPublicBookingPage = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    // Get workspace details
    const workspaceResult = await query(
      `SELECT id, business_name, address, timezone, is_active
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

    if (!workspace.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This booking page is not currently active',
      });
    }

    // Get active service types
    const serviceTypesResult = await query(
      `SELECT id, name, description, duration_minutes, location
       FROM service_types
       WHERE workspace_id = $1 AND is_active = true
       ORDER BY name`,
      [workspaceId]
    );

    // Get availability schedules
    const availabilityResult = await query(
      `SELECT day_of_week, start_time, end_time
       FROM availability_schedules
       WHERE workspace_id = $1 AND is_active = true
       ORDER BY day_of_week, start_time`,
      [workspaceId]
    );

    const serviceTypes = serviceTypesResult.rows.map(st => ({
      id: st.id,
      name: st.name,
      description: st.description,
      durationMinutes: st.duration_minutes,
      location: st.location,
    }));

    const availability = availabilityResult.rows.map(a => ({
      dayOfWeek: a.day_of_week,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][a.day_of_week],
      startTime: a.start_time,
      endTime: a.end_time,
    }));

    res.status(200).json({
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          businessName: workspace.business_name,
          address: workspace.address,
          timezone: workspace.timezone,
        },
        serviceTypes,
        availability,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createServiceType,
  getServiceTypes,
  updateServiceType,
  deleteServiceType,
  setAvailability,
  getAvailability,
  getPublicBookingPage,
};