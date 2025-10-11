const { sql } = require('../src/config/database');

const createNeonAuthTables = async () => {
  try {
    console.log('🚀 Starting Neon Auth tables migration...');

    // Update users table to support Neon Auth (make password_hash optional)
    await sql`
      ALTER TABLE users 
      ALTER COLUMN password_hash DROP NOT NULL
    `;

    // Add new columns for Neon Auth (separate statements)
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name VARCHAR(255)
    `;
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS image TEXT
    `;

    // Create accounts table for OAuth providers
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        provider_account_id VARCHAR(255) NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type VARCHAR(255),
        scope VARCHAR(255),
        id_token TEXT,
        session_state VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider, provider_account_id)
      )
    `;

    // Create sessions table for Neon Auth
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_token VARCHAR(255) UNIQUE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create verification tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, provider_account_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token)`;

    // Create triggers for automatic timestamp updates on new tables
    await sql`DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts`;
    await sql`
      CREATE TRIGGER update_accounts_updated_at
        BEFORE UPDATE ON accounts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('✅ Neon Auth tables migration completed successfully!');
    console.log('📋 Tables created/updated:');
    console.log('   - users (updated for Neon Auth)');
    console.log('   - accounts (OAuth providers)');
    console.log('   - sessions (Neon Auth sessions)');
    console.log('   - verification_tokens');

  } catch (error) {
    console.error('❌ Neon Auth migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  createNeonAuthTables()
    .then(() => {
      console.log('Neon Auth migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Neon Auth migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createNeonAuthTables };
