const { query, transaction } = require('../config/database');

/**
 * Create a new workspace
 */
const createWorkspace = async (req, res, next) => {
  try {
    const { businessName, address, timezone, contactEmail } = req.body;
    const ownerId = req.user.id;

    // Only owners can create workspaces
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only business owners can create workspaces',
      });
    }

    // Create workspace
    const result = await query(
      `INSERT INTO workspaces (owner_id, business_name, address, timezone, contact_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, owner_id, business_name, address, timezone, contact_email, 
                 is_active, setup_completed, created_at, updated_at`,
      [ownerId, businessName, address || null, timezone || 'UTC', contactEmail]
    );

    const workspace = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: {
        workspace: {
          id: workspace.id,
          ownerId: workspace.owner_id,
          businessName: workspace.business_name,
          address: workspace.address,
          timezone: workspace.timezone,
          contactEmail: workspace.contact_email,
          isActive: workspace.is_active,
          setupCompleted: workspace.setup_completed,
          createdAt: workspace.created_at,
          updatedAt: workspace.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update workspace details
 */
const updateWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { businessName, address, timezone, contactEmail } = req.body;
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
        message: 'Only the workspace owner can update workspace details',
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (businessName !== undefined) {
      updates.push(`business_name = $${paramCounter++}`);
      values.push(businessName);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCounter++}`);
      values.push(address);
    }
    if (timezone !== undefined) {
      updates.push(`timezone = $${paramCounter++}`);
      values.push(timezone);
    }
    if (contactEmail !== undefined) {
      updates.push(`contact_email = $${paramCounter++}`);
      values.push(contactEmail);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    values.push(workspaceId);

    const result = await query(
      `UPDATE workspaces
       SET ${updates.join(', ')}
       WHERE id = $${paramCounter}
       RETURNING id, owner_id, business_name, address, timezone, contact_email, 
                 is_active, setup_completed, created_at, updated_at`,
      values
    );

    const updatedWorkspace = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: {
        workspace: {
          id: updatedWorkspace.id,
          ownerId: updatedWorkspace.owner_id,
          businessName: updatedWorkspace.business_name,
          address: updatedWorkspace.address,
          timezone: updatedWorkspace.timezone,
          contactEmail: updatedWorkspace.contact_email,
          isActive: updatedWorkspace.is_active,
          setupCompleted: updatedWorkspace.setup_completed,
          createdAt: updatedWorkspace.created_at,
          updatedAt: updatedWorkspace.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate workspace
 * Before activation, verify that setup is complete
 */
const activateWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
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
        message: 'Only the workspace owner can activate the workspace',
      });
    }

    if (workspace.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Workspace is already active',
      });
    }

    // Verify setup requirements
    const setupErrors = [];

    // Check 1: At least one communication channel (email or SMS)
    const integrationsResult = await query(
      `SELECT type FROM integrations 
       WHERE workspace_id = $1 AND is_active = true AND type IN ('email', 'sms')`,
      [workspaceId]
    );

    if (integrationsResult.rows.length === 0) {
      setupErrors.push('At least one communication channel (email or SMS) must be configured');
    }

    // Check 2: At least one service type exists
    const serviceTypesResult = await query(
      'SELECT id FROM service_types WHERE workspace_id = $1 AND is_active = true',
      [workspaceId]
    );

    if (serviceTypesResult.rows.length === 0) {
      setupErrors.push('At least one service/booking type must be created');
    }

    // Check 3: Availability is defined
    const availabilityResult = await query(
      'SELECT id FROM availability_schedules WHERE workspace_id = $1 AND is_active = true',
      [workspaceId]
    );

    if (availabilityResult.rows.length === 0) {
      setupErrors.push('Availability schedule must be defined');
    }

    // If there are setup errors, return them
    if (setupErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Workspace cannot be activated. Setup is incomplete.',
        errors: setupErrors,
      });
    }

    // Activate workspace
    const result = await query(
      `UPDATE workspaces
       SET is_active = true, setup_completed = true
       WHERE id = $1
       RETURNING id, owner_id, business_name, address, timezone, contact_email, 
                 is_active, setup_completed, created_at, updated_at`,
      [workspaceId]
    );

    const activatedWorkspace = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Workspace activated successfully',
      data: {
        workspace: {
          id: activatedWorkspace.id,
          ownerId: activatedWorkspace.owner_id,
          businessName: activatedWorkspace.business_name,
          address: activatedWorkspace.address,
          timezone: activatedWorkspace.timezone,
          contactEmail: activatedWorkspace.contact_email,
          isActive: activatedWorkspace.is_active,
          setupCompleted: activatedWorkspace.setup_completed,
          createdAt: activatedWorkspace.created_at,
          updatedAt: activatedWorkspace.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get workspace status and setup progress
 */
const getWorkspaceStatus = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Get workspace details
    const workspaceResult = await query(
      'SELECT * FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const workspace = workspaceResult.rows[0];

    // Check if user has access (owner or staff member)
    let hasAccess = workspace.owner_id === userId;

    if (!hasAccess && req.user.role === 'staff') {
      const staffCheck = await query(
        'SELECT id FROM workspace_staff WHERE workspace_id = $1 AND user_id = $2',
        [workspaceId, userId]
      );
      hasAccess = staffCheck.rows.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace',
      });
    }

    // Get setup progress
    const setupProgress = {
      workspaceCreated: true,
      communicationConfigured: false,
      contactFormCreated: false,
      bookingTypesCreated: false,
      availabilityDefined: false,
      formsUploaded: false,
      inventorySetup: false,
      staffAdded: false,
    };

    // Check communication channels
    const integrationsResult = await query(
      `SELECT type FROM integrations 
       WHERE workspace_id = $1 AND is_active = true AND type IN ('email', 'sms')`,
      [workspaceId]
    );
    setupProgress.communicationConfigured = integrationsResult.rows.length > 0;

    // Check service types
    const serviceTypesResult = await query(
      'SELECT COUNT(*) as count FROM service_types WHERE workspace_id = $1 AND is_active = true',
      [workspaceId]
    );
    setupProgress.bookingTypesCreated = parseInt(serviceTypesResult.rows[0].count) > 0;

    // Check availability
    const availabilityResult = await query(
      'SELECT COUNT(*) as count FROM availability_schedules WHERE workspace_id = $1 AND is_active = true',
      [workspaceId]
    );
    setupProgress.availabilityDefined = parseInt(availabilityResult.rows[0].count) > 0;

    // Check forms
    const formsResult = await query(
      'SELECT COUNT(*) as count FROM forms WHERE workspace_id = $1 AND is_active = true',
      [workspaceId]
    );
    setupProgress.formsUploaded = parseInt(formsResult.rows[0].count) > 0;

    // Check inventory
    const inventoryResult = await query(
      'SELECT COUNT(*) as count FROM inventory_items WHERE workspace_id = $1',
      [workspaceId]
    );
    setupProgress.inventorySetup = parseInt(inventoryResult.rows[0].count) > 0;

    // Check staff
    const staffResult = await query(
      'SELECT COUNT(*) as count FROM workspace_staff WHERE workspace_id = $1',
      [workspaceId]
    );
    setupProgress.staffAdded = parseInt(staffResult.rows[0].count) > 0;

    // Calculate completion percentage
    const totalSteps = Object.keys(setupProgress).length;
    const completedSteps = Object.values(setupProgress).filter(Boolean).length;
    const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

    res.status(200).json({
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          ownerId: workspace.owner_id,
          businessName: workspace.business_name,
          address: workspace.address,
          timezone: workspace.timezone,
          contactEmail: workspace.contact_email,
          isActive: workspace.is_active,
          setupCompleted: workspace.setup_completed,
          createdAt: workspace.created_at,
          updatedAt: workspace.updated_at,
        },
        setupProgress,
        completionPercentage,
        canActivate: setupProgress.communicationConfigured && 
                     setupProgress.bookingTypesCreated && 
                     setupProgress.availabilityDefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkspace,
  updateWorkspace,
  activateWorkspace,
  getWorkspaceStatus,
};