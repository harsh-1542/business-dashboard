const { query, transaction } = require('../config/database');
const { hashPassword } = require('../utils/password.utils');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt.utils');
const crypto = require('crypto');
const { sendInviteEmail } = require('../services/notification.service');

/**
 * Send staff invitation
 */
const inviteStaff = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { email, permissions } = req.body;
    const ownerId = req.user.id;

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

    if (workspace.owner_id !== ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can invite staff members',
      });
    }

    // Check if user already exists and is already in workspace
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      const userId = existingUser.rows[0].id;
      const existingStaff = await query(
        'SELECT id FROM workspace_staff WHERE workspace_id = $1 AND user_id = $2',
        [workspaceId, userId]
      );

      if (existingStaff.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This user is already a staff member in this workspace',
        });
      }
    }

    // Check if there's already a pending invite
    const existingInvite = await query(
      `SELECT id FROM staff_invites 
       WHERE workspace_id = $1 AND email = $2 AND status = 'pending' AND expires_at > NOW()`,
      [workspaceId, email]
    );

    if (existingInvite.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An invitation has already been sent to this email',
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite
    const result = await query(
      `INSERT INTO staff_invites (workspace_id, email, token, permissions, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, token, permissions, expires_at, created_at`,
      [workspaceId, email, token, JSON.stringify(permissions), ownerId, expiresAt]
    );

    const invite = result.rows[0];

    // Send invite email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const inviteLink = `${frontendUrl}/invite/accept?token=${token}`;
    
    try {
      await sendInviteEmail(email, workspace.business_name, inviteLink);
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Continue anyway - invite is created
    }

    res.status(201).json({
      success: true,
      message: 'Staff invitation sent successfully',
      data: {
        invite: {
          id: invite.id,
          email: invite.email,
          workspaceName: workspace.business_name,
          permissions: invite.permissions,
          expiresAt: invite.expires_at,
          inviteLink, // For testing purposes
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept staff invitation and register
 */
const acceptInvite = async (req, res, next) => {
  try {
    const { token, password, firstName, lastName } = req.body;

    // Find and validate invite
    const inviteResult = await query(
      `SELECT si.*, w.business_name
       FROM staff_invites si
       JOIN workspaces w ON si.workspace_id = w.id
       WHERE si.token = $1 AND si.status = 'pending' AND si.expires_at > NOW()`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation',
      });
    }

    const invite = inviteResult.rows[0];

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [invite.email]
    );

    let userId;

    if (existingUser.rows.length > 0) {
      // User exists, just add to workspace
      userId = existingUser.rows[0].id;
    } else {
      // Create new user
      const passwordHash = await hashPassword(password);
      const userResult = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, auth_provider)
         VALUES ($1, $2, $3, $4, 'staff', 'local')
         RETURNING id`,
        [invite.email, passwordHash, firstName, lastName]
      );
      userId = userResult.rows[0].id;
    }

    // Add to workspace
    await query(
      `INSERT INTO workspace_staff (workspace_id, user_id, permissions)
       VALUES ($1, $2, $3)`,
      [invite.workspace_id, userId, invite.permissions]
    );

    // Mark invite as accepted
    await query(
      `UPDATE staff_invites SET status = 'accepted' WHERE id = $1`,
      [invite.id]
    );

    // Generate tokens
    const accessToken = generateAccessToken(userId, invite.email, 'staff');
    const refreshToken = generateRefreshToken(userId, invite.email, 'staff');

    // Store refresh token
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, refreshToken, tokenExpiresAt]
    );

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        user: {
          id: userId,
          email: invite.email,
          firstName,
          lastName,
          role: 'staff',
        },
        workspace: {
          id: invite.workspace_id,
          businessName: invite.business_name,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify invite token (check if valid)
 */
const verifyInviteToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT si.email, si.permissions, si.expires_at, w.business_name
       FROM staff_invites si
       JOIN workspaces w ON si.workspace_id = w.id
       WHERE si.token = $1 AND si.status = 'pending' AND si.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation',
      });
    }

    const invite = result.rows[0];

    // Check if user already exists
    const existingUser = await query(
      'SELECT id, first_name, last_name FROM users WHERE email = $1',
      [invite.email]
    );

    res.status(200).json({
      success: true,
      data: {
        email: invite.email,
        workspaceName: invite.business_name,
        permissions: invite.permissions,
        expiresAt: invite.expires_at,
        userExists: existingUser.rows.length > 0,
        existingUser: existingUser.rows.length > 0 ? {
          firstName: existingUser.rows[0].first_name,
          lastName: existingUser.rows[0].last_name,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Register a new staff member (can be used by owner or during invite)
 */
const registerStaff = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with staff role
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, 'staff')
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.status(201).json({
      success: true,
      message: 'Staff member registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add staff member to workspace with permissions
 */
const addStaffToWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { staffEmail, permissions } = req.body;
    const ownerId = req.user.id;

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

    if (workspace.owner_id !== ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can add staff members',
      });
    }

    // Find staff user by email
    const staffResult = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1',
      [staffEmail]
    );

    if (staffResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found. They need to register first.',
      });
    }

    const staff = staffResult.rows[0];

    // Check if staff member is already added to this workspace
    const existingStaff = await query(
      'SELECT id FROM workspace_staff WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, staff.id]
    );

    if (existingStaff.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Staff member is already added to this workspace',
      });
    }

    // Default permissions if not provided
    const defaultPermissions = {
      inbox: true,
      bookings: true,
      forms: true,
      inventory: false,
    };

    const staffPermissions = permissions || defaultPermissions;

    // Add staff to workspace
    const result = await query(
      `INSERT INTO workspace_staff (workspace_id, user_id, permissions)
       VALUES ($1, $2, $3)
       RETURNING id, workspace_id, user_id, permissions, added_at`,
      [workspaceId, staff.id, JSON.stringify(staffPermissions)]
    );

    const workspaceStaff = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Staff member added to workspace successfully',
      data: {
        workspaceStaff: {
          id: workspaceStaff.id,
          workspaceId: workspaceStaff.workspace_id,
          workspaceName: workspace.business_name,
          staff: {
            id: staff.id,
            email: staff.email,
            firstName: staff.first_name,
            lastName: staff.last_name,
            role: staff.role,
          },
          permissions: workspaceStaff.permissions,
          addedAt: workspaceStaff.added_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update staff permissions in workspace
 */
const updateStaffPermissions = async (req, res, next) => {
  try {
    const { workspaceId, staffId } = req.params;
    const { permissions } = req.body;
    const ownerId = req.user.id;

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

    if (workspace.owner_id !== ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can update staff permissions',
      });
    }

    // Check if staff member exists in workspace
    const staffCheck = await query(
      `SELECT ws.id, ws.permissions, u.email, u.first_name, u.last_name
       FROM workspace_staff ws
       JOIN users u ON ws.user_id = u.id
       WHERE ws.workspace_id = $1 AND ws.user_id = $2`,
      [workspaceId, staffId]
    );

    if (staffCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in this workspace',
      });
    }

    // Update permissions
    const result = await query(
      `UPDATE workspace_staff
       SET permissions = $1
       WHERE workspace_id = $2 AND user_id = $3
       RETURNING id, workspace_id, user_id, permissions, added_at`,
      [JSON.stringify(permissions), workspaceId, staffId]
    );

    const updatedStaff = result.rows[0];
    const staffInfo = staffCheck.rows[0];

    res.status(200).json({
      success: true,
      message: 'Staff permissions updated successfully',
      data: {
        workspaceStaff: {
          id: updatedStaff.id,
          workspaceId: updatedStaff.workspace_id,
          staff: {
            id: staffId,
            email: staffInfo.email,
            firstName: staffInfo.first_name,
            lastName: staffInfo.last_name,
          },
          permissions: updatedStaff.permissions,
          addedAt: updatedStaff.added_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove staff member from workspace
 */
const removeStaffFromWorkspace = async (req, res, next) => {
  try {
    const { workspaceId, staffId } = req.params;
    const ownerId = req.user.id;

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

    if (workspace.owner_id !== ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Only the workspace owner can remove staff members',
      });
    }

    // Check if staff member exists in workspace
    const staffCheck = await query(
      'SELECT id FROM workspace_staff WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, staffId]
    );

    if (staffCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in this workspace',
      });
    }

    // Remove staff from workspace
    await query(
      'DELETE FROM workspace_staff WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, staffId]
    );

    res.status(200).json({
      success: true,
      message: 'Staff member removed from workspace successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all staff members in a workspace
 */
const getWorkspaceStaff = async (req, res, next) => {
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

    // Get all staff members (including owner)
    const result = await query(
      `SELECT 
        'owner' as id,
        u.id as user_id,
        '{"inbox": true, "bookings": true, "forms": true, "inventory": true}'::jsonb as permissions,
        w.created_at as added_at,
        u.email, u.first_name, u.last_name, 'owner' as role, u.is_active
       FROM workspaces w
       JOIN users u ON w.owner_id = u.id
       WHERE w.id = $1

       UNION ALL

       SELECT ws.id::text, ws.user_id, ws.permissions, ws.added_at,
              u.email, u.first_name, u.last_name, u.role, u.is_active
       FROM workspace_staff ws
       JOIN users u ON ws.user_id = u.id
       WHERE ws.workspace_id = $1
       ORDER BY role ASC, added_at DESC`,
      [workspaceId]
    );

    const staff = result.rows.map(s => ({
      id: s.id,
      userId: s.user_id,
      email: s.email,
      firstName: s.first_name,
      lastName: s.last_name,
      role: s.role,
      isActive: s.is_active,
      permissions: s.permissions,
      addedAt: s.added_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        staff,
        count: staff.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get staff member's workspaces and permissions
 */
const getStaffWorkspaces = async (req, res, next) => {
  try {
    const staffId = req.user.id;

    // Get all workspaces where user is staff
    const result = await query(
      `SELECT w.id, w.business_name, w.address, w.timezone, w.contact_email, w.is_active,
              ws.permissions, ws.added_at
       FROM workspaces w
       JOIN workspace_staff ws ON w.id = ws.workspace_id
       WHERE ws.user_id = $1
       ORDER BY ws.added_at DESC`,
      [staffId]
    );

    const workspaces = result.rows.map(w => ({
      id: w.id,
      businessName: w.business_name,
      address: w.address,
      timezone: w.timezone,
      contactEmail: w.contact_email,
      isActive: w.is_active,
      permissions: w.permissions,
      addedAt: w.added_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        workspaces,
        count: workspaces.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  inviteStaff,
  acceptInvite,
  verifyInviteToken,
  registerStaff,
  addStaffToWorkspace,
  updateStaffPermissions,
  removeStaffFromWorkspace,
  getWorkspaceStaff,
  getStaffWorkspaces,
};