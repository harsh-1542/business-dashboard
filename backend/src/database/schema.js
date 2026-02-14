const { pool } = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table (Business Owners and Staff)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        auth_provider VARCHAR(50) NOT NULL DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'staff')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrate existing users table: make password_hash nullable and add auth_provider column
    // Check if auth_provider column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='auth_provider';
    `);

    if (columnCheck.rows.length === 0) {
      // Add auth_provider column with default 'local' for existing users
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local' CHECK (auth_provider IN ('local', 'google'));
      `);
      
      // Make password_hash nullable
      await client.query(`
        ALTER TABLE users 
        ALTER COLUMN password_hash DROP NOT NULL;
      `);
      
      console.log('✅ Migrated users table: added auth_provider column and made password_hash nullable');
    }

    // Add phone and bio columns for user profile
    const phoneColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='phone';
    `);

    if (phoneColumnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN phone VARCHAR(50),
        ADD COLUMN bio TEXT;
      `);
      console.log('✅ Added phone and bio columns to users table');
    }

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Refresh tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_revoked BOOLEAN DEFAULT false
      );
    `);

    // Create index on user_id and token
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
    `);

    // Workspaces table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        business_type VARCHAR(50),
        address TEXT,
        timezone VARCHAR(100) DEFAULT 'UTC',
        contact_email VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT false,
        setup_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if slug column exists, if not add it
    const slugColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='workspaces' AND column_name='slug';
    `);

    if (slugColumnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE workspaces 
        ADD COLUMN slug VARCHAR(255) UNIQUE;
      `);
      console.log('✅ Added slug column to workspaces table');
    }

    // Check if business_type column exists, if not add it
    const businessTypeColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='workspaces' AND column_name='business_type';
    `);

    if (businessTypeColumnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE workspaces 
        ADD COLUMN business_type VARCHAR(50);
      `);
      console.log('✅ Added business_type column to workspaces table');
    }

    // Create index on owner_id and slug
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
      CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
    `);

    // Workspace staff members (many-to-many relationship)
    await client.query(`
      CREATE TABLE IF NOT EXISTS workspace_staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permissions JSONB DEFAULT '{"inbox": true, "bookings": true, "forms": true, "inventory": false}',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(workspace_id, user_id)
      );
    `);

    // Communication integrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'calendar', 'storage', 'webhook')),
        provider VARCHAR(100) NOT NULL,
        config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Service types / Booking types
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INTEGER NOT NULL,
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Availability schedules
    await client.query(`
      CREATE TABLE IF NOT EXISTS availability_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Contacts
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        source VARCHAR(50) DEFAULT 'form',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
    `);

    // Conversations
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON conversations(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON conversations(contact_id);
    `);

    // Messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('contact', 'staff', 'system')),
        sender_id UUID,
        channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'system')),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    `);

    // Bookings
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'no_show', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_workspace_id ON bookings(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_contact_id ON bookings(contact_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
    `);

    // Forms
    await client.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        form_fields JSONB NOT NULL,
        linked_service_type_id UUID REFERENCES service_types(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Form submissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        submission_data JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
        submitted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_form_submissions_booking_id ON form_submissions(booking_id);
      CREATE INDEX IF NOT EXISTS idx_form_submissions_contact_id ON form_submissions(contact_id);
    `);

    // Inventory items
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity_available INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER NOT NULL DEFAULT 10,
        unit VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Inventory usage tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
        quantity_used INTEGER NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Alerts/Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('missed_message', 'unconfirmed_booking', 'overdue_form', 'low_inventory', 'system')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link_to TEXT,
        is_read BOOLEAN DEFAULT false,
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_workspace_id ON alerts(workspace_id);
    `);

    // Automation logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action_taken VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'skipped')),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_automation_logs_workspace_id ON automation_logs(workspace_id);
    `);

    // Function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add triggers for updated_at
    const tablesWithUpdatedAt = [
      'users', 'workspaces', 'integrations', 'service_types',
      'contacts', 'conversations', 'bookings', 'forms',
      'form_submissions', 'inventory_items'
    ];

    for (const table of tablesWithUpdatedAt) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    await client.query('COMMIT');
    console.log('✅ All tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const dropTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      DROP TABLE IF EXISTS automation_logs CASCADE;
      DROP TABLE IF EXISTS alerts CASCADE;
      DROP TABLE IF EXISTS inventory_usage CASCADE;
      DROP TABLE IF EXISTS inventory_items CASCADE;
      DROP TABLE IF EXISTS form_submissions CASCADE;
      DROP TABLE IF EXISTS forms CASCADE;
      DROP TABLE IF EXISTS bookings CASCADE;
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS conversations CASCADE;
      DROP TABLE IF EXISTS contacts CASCADE;
      DROP TABLE IF EXISTS availability_schedules CASCADE;
      DROP TABLE IF EXISTS service_types CASCADE;
      DROP TABLE IF EXISTS integrations CASCADE;
      DROP TABLE IF EXISTS workspace_staff CASCADE;
      DROP TABLE IF EXISTS workspaces CASCADE;
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    `);
    
    await client.query('COMMIT');
    console.log('✅ All tables dropped successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error dropping tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createTables,
  dropTables,
};