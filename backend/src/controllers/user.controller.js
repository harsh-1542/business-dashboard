const { query } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password.utils');

/**
 * Get user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT id, email, first_name, last_name, role, phone, bio, is_active, created_at, auth_provider
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          bio: user.bio,
          isActive: user.is_active,
          createdAt: user.created_at,
          authProvider: user.auth_provider
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, bio } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(userId);
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, phone, bio, is_active, created_at
    `;

    const result = await query(updateQuery, values);
    const user = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          bio: user.bio,
          isActive: user.is_active,
          createdAt: user.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user's current password hash and auth provider
    const userResult = await query(
      'SELECT password_hash, auth_provider FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Check if user uses local auth (has password)
    if (user.auth_provider !== 'local') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for accounts created with Google. Please manage your password through Google.'
      });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'No password set for this account'
      });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password strength (basic validation)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Optionally, revoke all existing refresh tokens for security
    await query(
      'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
