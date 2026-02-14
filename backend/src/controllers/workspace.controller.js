const { query, transaction } = require('../config/database');

/**
 * Generate a URL-friendly slug from business name
 */
const generateSlug = (businessName) => {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Ensure slug is unique by appending a number if necessary
 */
const ensureUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await query('SELECT id FROM workspaces WHERE slug = $1', [slug]);
    if (existing.rows.length === 0) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * Create a new workspace
 */
const createWorkspace = async (req, res, next) => {
  try {
    const { businessName, businessType, address, timezone, contactEmail } = req.body;
    const ownerId = req.user.id;

    // Only owners can create workspaces
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only business owners can create workspaces',
      });
    }

    // Generate unique slug
    const baseSlug = generateSlug(businessName);
    const slug = await ensureUniqueSlug(baseSlug);

    // Create workspace
    const result = await query(
      `INSERT INTO workspaces (owner_id, business_name, slug, business_type, address, timezone, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, owner_id, business_name, slug, business_type, address, timezone, contact_email, 
                 is_active, setup_completed, created_at, updated_at`,
      [ownerId, businessName, slug, businessType || null, address || null, timezone || 'UTC', contactEmail]
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
          slug: workspace.slug,
          businessType: workspace.business_type,
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
       RETURNING id, owner_id, business_name, slug, business_type, address, timezone, contact_email, 
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
          slug: updatedWorkspace.slug,
          businessType: updatedWorkspace.business_type,
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

    // Communication is pre-configured via harshshrimali.in domain - no check needed

    // Check 1: At least one service type exists
    const serviceTypesResult = await query(
      'SELECT id FROM service_types WHERE workspace_id = $1 AND is_active = true',
      [workspaceId]
    );

    if (serviceTypesResult.rows.length === 0) {
      setupErrors.push('At least one service/booking type must be created');
    }

    // Check 2: Availability is defined
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
       RETURNING id, owner_id, business_name, slug, business_type, address, timezone, contact_email, 
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
          slug: activatedWorkspace.slug,
          businessType: activatedWorkspace.business_type,
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
      communicationConfigured: true, // Always true - emails configured via harshshrimali.in domain
      bookingTypesCreated: false,
      availabilityDefined: false,
    };

    // Communication is pre-configured via harshshrimali.in domain - no check needed


    // Check service types
    const serviceTypesResult = await query(
      'SELECT id FROM service_types WHERE workspace_id = $1 AND is_active = true',
      [workspaceId]
    );
    setupProgress.bookingTypesCreated = serviceTypesResult.rows.length > 0;

    // Check availability
    const availabilityResult = await query(
      'SELECT id FROM availability_schedules WHERE workspace_id = $1 AND is_active = true',
      [workspaceId]
    );
    setupProgress.availabilityDefined = availabilityResult.rows.length > 0;

    // Calculate completion
    const completedSteps = Object.values(setupProgress).filter(Boolean).length;
    const totalSteps = Object.keys(setupProgress).length;
    const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
    const canActivate = completedSteps === totalSteps && !workspace.is_active;

    res.status(200).json({
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          ownerId: workspace.owner_id,
          businessName: workspace.business_name,
          slug: workspace.slug,
          businessType: workspace.business_type,
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
        canActivate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete workspace
 * Only the owner can delete a workspace
 * This will cascade delete all related data (staff, bookings, contacts, etc.)
 */
const deleteWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Check if workspace exists and user is the owner
    const workspaceCheck = await query(
      'SELECT id, owner_id, business_name FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (workspaceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const workspace = workspaceCheck.rows[0];

    // Only the owner can delete the workspace
    if (workspace.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can delete the workspace',
      });
    }

    // Delete the workspace (cascade will handle related data)
    await query('DELETE FROM workspaces WHERE id = $1', [workspaceId]);

    res.status(200).json({
      success: true,
      message: `Workspace "${workspace.business_name}" has been deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};




 

/**
 * Get workspace setup status
 * Add this function to workspace.controller.js before module.exports
 */

module.exports = {
  createWorkspace,
  updateWorkspace,
  activateWorkspace,
  getWorkspaceStatus,
  deleteWorkspace,
};



