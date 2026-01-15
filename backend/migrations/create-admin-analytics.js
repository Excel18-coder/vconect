const { sql } = require('../src/config/database');

/**
 * Create Admin Analytics & Audit System Tables
 *
 * This migration creates the complete analytics infrastructure for the admin dashboard:
 * - User events tracking
 * - Admin audit logs
 * - Security events monitoring
 * - Daily analytics aggregations
 * - Permissions system
 */

const createAdminAnalyticsTables = async () => {
  try {
    console.log('🔧 Creating admin analytics and audit system...\n');

    // ============================================================================
    // 1. USER EVENTS TABLE - Track all user activities
    // ============================================================================
    console.log('📊 Creating user_events table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        event_type VARCHAR(50) NOT NULL,
        event_category VARCHAR(50) NOT NULL,
        event_data JSONB DEFAULT '{}'::jsonb,
        ip_address INET,
        user_agent TEXT,
        session_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Indexes for efficient querying
    await sql`CREATE INDEX IF NOT EXISTS idx_user_events_user_id 
              ON user_events(user_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_events_type 
              ON user_events(event_type, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_events_category 
              ON user_events(event_category, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_events_created 
              ON user_events(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_events_session 
              ON user_events(session_id, created_at DESC)`;

    console.log('   ✅ User events table created with indexes\n');

    // ============================================================================
    // 2. ADMIN AUDIT LOGS - Track all admin actions
    // ============================================================================
    console.log('🔍 Creating admin_audit_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        target_id UUID,
        before_state JSONB,
        after_state JSONB,
        reason TEXT,
        ip_address INET NOT NULL,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Indexes for audit log queries
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id 
              ON admin_audit_logs(admin_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_target 
              ON admin_audit_logs(target_type, target_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_action 
              ON admin_audit_logs(action, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_audit_created 
              ON admin_audit_logs(created_at DESC)`;

    console.log('   ✅ Admin audit logs table created with indexes\n');

    // ============================================================================
    // 3. SECURITY EVENTS - Track security-related events
    // ============================================================================
    console.log('🔒 Creating security_events table...');
    await sql`
      CREATE TABLE IF NOT EXISTS security_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        description TEXT,
        ip_address INET,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        resolved BOOLEAN DEFAULT false,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Indexes for security monitoring
    await sql`CREATE INDEX IF NOT EXISTS idx_security_events_user_id 
              ON security_events(user_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_security_events_severity 
              ON security_events(severity, created_at DESC) WHERE resolved = false`;
    await sql`CREATE INDEX IF NOT EXISTS idx_security_events_type 
              ON security_events(event_type, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_security_events_unresolved 
              ON security_events(created_at DESC) WHERE resolved = false`;
    await sql`CREATE INDEX IF NOT EXISTS idx_security_events_ip 
              ON security_events(ip_address, created_at DESC)`;

    console.log('   ✅ Security events table created with indexes\n');

    // ============================================================================
    // 4. ANALYTICS DAILY - Pre-aggregated daily metrics
    // ============================================================================
    console.log('📈 Creating analytics_daily table...');
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_daily (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        metric_value NUMERIC NOT NULL,
        dimensions JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, metric_name, dimensions)
      )
    `;

    // Indexes for fast analytics queries
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_daily_date 
              ON analytics_daily(date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_daily_metric 
              ON analytics_daily(metric_name, date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_daily_dimensions 
              ON analytics_daily USING gin(dimensions)`;

    console.log('   ✅ Analytics daily table created with indexes\n');

    // ============================================================================
    // 5. USER PERMISSIONS - Granular permission control
    // ============================================================================
    console.log('🔑 Creating user_permissions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id UUID,
        granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        UNIQUE(user_id, permission, resource_type, resource_id)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
              ON user_permissions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_permissions_permission 
              ON user_permissions(permission) WHERE expires_at IS NULL OR expires_at > NOW()`;

    console.log('   ✅ User permissions table created with indexes\n');

    // ============================================================================
    // 6. ADMIN SESSIONS - Track admin login sessions for revocation
    // ============================================================================
    console.log('🔐 Creating admin_sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(500) UNIQUE NOT NULL,
        ip_address INET NOT NULL,
        user_agent TEXT,
        login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT false,
        revoked_at TIMESTAMP,
        revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
        revoke_reason TEXT
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id 
              ON admin_sessions(user_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_token 
              ON admin_sessions(session_token) WHERE revoked = false AND expires_at > NOW()`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_active 
              ON admin_sessions(user_id) WHERE revoked = false AND expires_at > NOW()`;

    console.log('   ✅ Admin sessions table created with indexes\n');

    // ============================================================================
    // 7. FEATURE FLAGS - System-wide feature toggles
    // ============================================================================
    console.log('🚩 Creating feature_flags table...');
    await sql`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flag_name VARCHAR(100) UNIQUE NOT NULL,
        enabled BOOLEAN DEFAULT false,
        description TEXT,
        rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
        target_users JSONB DEFAULT '[]'::jsonb,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled 
              ON feature_flags(flag_name) WHERE enabled = true`;

    console.log('   ✅ Feature flags table created with indexes\n');

    // ============================================================================
    // 8. SYSTEM SETTINGS - Admin-configurable system settings
    // ============================================================================
    console.log('⚙️  Creating system_settings table...');
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value JSONB NOT NULL,
        setting_type VARCHAR(50) NOT NULL,
        description TEXT,
        is_sensitive BOOLEAN DEFAULT false,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('   ✅ System settings table created\n');

    // ============================================================================
    // 9. Update profiles table to add suspension tracking
    // ============================================================================
    console.log('👤 Enhancing profiles table...');
    await sql`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS suspend_reason TEXT,
      ADD COLUMN IF NOT EXISTS suspend_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS ban_reason TEXT
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_suspended 
              ON profiles(user_id) WHERE is_suspended = true`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_banned 
              ON profiles(user_id) WHERE is_banned = true`;

    console.log('   ✅ Profiles table enhanced with suspension tracking\n');

    // ============================================================================
    // 10. Create views for common analytics queries
    // ============================================================================
    console.log('👁️  Creating analytics views...');

    // Active users view (logged in within last 30 days)
    await sql`
      CREATE OR REPLACE VIEW active_users_view AS
      SELECT 
        u.id,
        u.email,
        u.created_at,
        p.display_name,
        p.user_type,
        p.location,
        MAX(ue.created_at) as last_activity
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN user_events ue ON u.id = ue.user_id
      WHERE ue.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY u.id, u.email, u.created_at, p.display_name, p.user_type, p.location
    `;

    // Daily user registrations view
    await sql`
      CREATE OR REPLACE VIEW daily_registrations_view AS
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as registrations,
        COUNT(CASE WHEN p.user_type = 'buyer' THEN 1 END) as buyers,
        COUNT(CASE WHEN p.user_type = 'seller' THEN 1 END) as sellers,
        COUNT(CASE WHEN p.user_type = 'landlord' THEN 1 END) as landlords
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    console.log('   ✅ Analytics views created\n');

    // ============================================================================
    // 11. Create trigger for auto-updating timestamps
    // ============================================================================
    console.log('⏰ Creating timestamp triggers...');

    await sql`DROP TRIGGER IF EXISTS update_analytics_daily_updated_at ON analytics_daily`;
    await sql`
      CREATE TRIGGER update_analytics_daily_updated_at
        BEFORE UPDATE ON analytics_daily
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings`;
    await sql`
      CREATE TRIGGER update_system_settings_updated_at
        BEFORE UPDATE ON system_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags`;
    await sql`
      CREATE TRIGGER update_feature_flags_updated_at
        BEFORE UPDATE ON feature_flags
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('   ✅ Timestamp triggers created\n');

    // ============================================================================
    // Summary
    // ============================================================================
    console.log('✅ Admin analytics system created successfully!\n');
    console.log('📋 Tables created:');
    console.log('   ✓ user_events - User activity tracking');
    console.log('   ✓ admin_audit_logs - Admin action auditing');
    console.log('   ✓ security_events - Security monitoring');
    console.log('   ✓ analytics_daily - Pre-aggregated metrics');
    console.log('   ✓ user_permissions - Granular permissions');
    console.log('   ✓ admin_sessions - Session management');
    console.log('   ✓ feature_flags - Feature toggles');
    console.log('   ✓ system_settings - System configuration');
    console.log('\n📊 Views created:');
    console.log('   ✓ active_users_view');
    console.log('   ✓ daily_registrations_view');
    console.log('\n🔧 Enhancements:');
    console.log('   ✓ profiles table - suspension & ban tracking');
    console.log('   ✓ Comprehensive indexing for performance');
    console.log('   ✓ Timestamp auto-update triggers\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  createAdminAnalyticsTables()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdminAnalyticsTables };
