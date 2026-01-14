/**
 * Create Default Admin Account
 * Creates admin@gmail.com with password: 123456
 */

const { sql } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function createDefaultAdmin() {
  try {
    console.log('🔐 Creating default admin account...');

    const adminEmail = 'admin@gmail.com';
    const adminPassword = '123456';

    // Check if admin already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${adminEmail}
    `;

    if (existingUser.length > 0) {
      console.log('ℹ️  Admin account already exists');

      // Make sure the user is set as admin
      await sql`
        UPDATE profiles 
        SET user_type = 'admin' 
        WHERE user_id = ${existingUser[0].id}
      `;

      console.log('✅ Verified admin account status');
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const newUser = await sql`
      INSERT INTO users (email, password_hash, email_verified)
      VALUES (${adminEmail}, ${passwordHash}, true)
      RETURNING id
    `;

    const userId = newUser[0].id;

    // Create admin profile
    await sql`
      INSERT INTO profiles (user_id, display_name, user_type)
      VALUES (${userId}, 'System Administrator', 'admin')
    `;

    console.log('✅ Default admin account created successfully!');
    console.log('');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: 123456');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  createDefaultAdmin();
}

module.exports = { createDefaultAdmin };
