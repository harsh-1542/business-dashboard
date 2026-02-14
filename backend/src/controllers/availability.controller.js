const { query } = require('../config/database');

/**
 * Create availability schedule
 */
const createAvailability = async (req, res, next) => {
  try {
    const { workspaceId, dayOfWeek, startTime, endTime } = req.body;
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
        message: 'Only workspace owner can set availability',
      });
    }

    const result = await query(
      `INSERT INTO availability_schedules (workspace_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING id, workspace_id, day_of_week, start_time, end_time, is_active, created_at`,
      [workspaceId, dayOfWeek, startTime, endTime]
    );

    const schedule = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Availability created successfully',
      data: {
        schedule: {
          id: schedule.id,
          workspaceId: schedule.workspace_id,
          dayOfWeek: schedule.day_of_week,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          isActive: schedule.is_active,
          createdAt: schedule.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get availability schedules for a workspace
 */
const getAvailabilityByWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await query(
      `SELECT id, workspace_id, day_of_week, start_time, end_time, is_active, created_at
       FROM availability_schedules
       WHERE workspace_id = $1 AND is_active = true
       ORDER BY day_of_week, start_time`,
      [workspaceId]
    );

    res.status(200).json({
      success: true,
      data: {
        schedules: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete availability schedule
 */
const deleteAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const scheduleCheck = await query(
      `SELECT a.id, a.workspace_id, w.owner_id
       FROM availability_schedules a
       JOIN workspaces w ON a.workspace_id = w.id
       WHERE a.id = $1`,
      [id]
    );

    if (scheduleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Availability schedule not found',
      });
    }

    if (scheduleCheck.rows[0].owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner can delete availability',
      });
    }

    await query('DELETE FROM availability_schedules WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Availability deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAvailability,
  getAvailabilityByWorkspace,
  deleteAvailability,
};
