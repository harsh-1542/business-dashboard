const { query, transaction } = require("../config/database");
const { hashPassword, comparePassword } = require("../utils/password.utils");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt.utils");
const { supabase } = require("../config/supabase");

/**
 * Register a new business owner
 */
const registerOwner = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with owner role and local auth provider
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, auth_provider)
       VALUES ($1, $2, $3, $4, 'owner', 'local')
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email, passwordHash, firstName, lastName],
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, expiresAt],
    );

    res.status(201).json({
      success: true,
      message: "Owner registered successfully",
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
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query(
      "SELECT id, email, password_hash, first_name, last_name, role, is_active, auth_provider FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Only allow password login for local auth provider
    if (user.auth_provider !== 'local') {
      return res.status(401).json({
        success: false,
        message: "This account was created with Google. Please sign in with Google.",
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, expiresAt],
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
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
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Check if refresh token exists in database and is not revoked
    const tokenResult = await query(
      `SELECT rt.id, rt.expires_at, rt.is_revoked, u.id as user_id, u.email, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.user_id = $2`,
      [refreshToken, decoded.userId],
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found",
      });
    }

    const tokenData = tokenResult.rows[0];

    // Check if token is revoked
    if (tokenData.is_revoked) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has been revoked",
      });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has expired",
      });
    }

    // Check if user is active
    if (!tokenData.is_active) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(
      tokenData.user_id,
      tokenData.email,
      tokenData.role,
    );

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (revoke refresh token)
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Revoke refresh token
    await query(
      "UPDATE refresh_tokens SET is_revoked = true WHERE token = $1",
      [refreshToken],
    );

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current session context
 */
const getSessionContext = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user details
    const userResult = await query(
      "SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    // Get workspaces (owned or member)
    let workspaces = [];

    if (user.role === "owner") {
      // Get owned workspaces
      const workspaceResult = await query(
        `SELECT id, business_name, address, timezone, contact_email, is_active, setup_completed, created_at
         FROM workspaces
         WHERE owner_id = $1
         ORDER BY created_at DESC`,
        [userId],
      );
      workspaces = workspaceResult.rows.map((w) => ({
        id: w.id,
        businessName: w.business_name,
        address: w.address,
        timezone: w.timezone,
        contactEmail: w.contact_email,
        isActive: w.is_active,
        setupCompleted: w.setup_completed,
        role: "owner",
        createdAt: w.created_at,
      }));
    } else {
      // Get workspaces where user is staff
      const workspaceResult = await query(
        `SELECT w.id, w.business_name, w.address, w.timezone, w.contact_email, w.is_active, 
                ws.permissions, ws.added_at
         FROM workspaces w
         JOIN workspace_staff ws ON w.id = ws.workspace_id
         WHERE ws.user_id = $1
         ORDER BY ws.added_at DESC`,
        [userId],
      );
      workspaces = workspaceResult.rows.map((w) => ({
        id: w.id,
        businessName: w.business_name,
        address: w.address,
        timezone: w.timezone,
        contactEmail: w.contact_email,
        isActive: w.is_active,
        role: "staff",
        permissions: w.permissions,
        addedAt: w.added_at,
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
        },
        workspaces,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login or register user via Supabase (e.g. Google)
 * Expects a Supabase access token in Authorization header or body.
 */
const supabaseLogin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const tokenFromHeader = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const accessToken = tokenFromHeader || req.body.accessToken;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Supabase access token is required",
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase client is not configured on the server",
      });
    }

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Supabase token",
      });
    }

    const supaUser = data.user;
    const email = supaUser.email;
    const fullName =
      supaUser.user_metadata?.full_name ||
      supaUser.user_metadata?.name ||
      supaUser.user_metadata?.user_name ||
      supaUser.user_metadata?.fullName;

    const [firstName, ...rest] = (fullName || "").split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is missing from Supabase user profile",
      });
    }

    // Find existing user by email
    const result = await query(
      "SELECT id, email, first_name, last_name, role, is_active, auth_provider FROM users WHERE email = $1",
      [email],
    );

    let user;

    if (result.rows.length === 0) {
      // Create new owner user with Google auth provider (no password)
      const insertResult = await query(
        `INSERT INTO users (email, first_name, last_name, role, is_active, auth_provider, password_hash)
         VALUES ($1, $2, $3, 'owner', true, 'google', NULL)
         RETURNING id, email, first_name, last_name, role, is_active, created_at`,
        [email, firstName || "", lastName || ""],
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated. Please contact support.",
        });
      }

      // If user exists but was created with local auth, update to google (optional - you might want to keep it as is)
      // For now, we'll allow Google login even if they previously had local auth
      // You can add logic here to merge accounts or prevent login if needed
    }

    // Generate local tokens
    const accessTokenLocal = generateAccessToken(
      user.id,
      user.email,
      user.role,
    );
    const refreshTokenLocal = generateRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshTokenLocal, expiresAt],
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
        },
        tokens: {
          accessToken: accessTokenLocal,
          refreshToken: refreshTokenLocal,
        },
      },
    });
  } catch (error) {
    console.log('====================================');
    console.log("error in supabase login", error);
    console.log('====================================');  
    next(error);
  }
};

module.exports = {
  registerOwner,
  login,
  refreshToken,
  logout,
  getSessionContext,
  supabaseLogin,
};
