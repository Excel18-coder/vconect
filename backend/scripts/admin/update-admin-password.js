/**
 * Update Admin Password
 * Updates admin@gmail.com password to 123456
 */

const { sql } = require('../../src/config/database');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
  try {
    console.log('🔐 Updating admin password...');

    const adminEmail = 'admin@gmail.com';
    const newPassword = '123456';

    // Check if admin exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${adminEmail}
    `;

    if (existingUser.length === 0) {
      console.error('❌ Admin account not found');
      process.exit(1);
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}
      WHERE email = ${adminEmail}
    `;

    console.log('✅ Admin password updated successfully!');
    console.log('');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 New Password: 123456');
    console.log('');
    console.log('You can now login with the new password.');
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  updateAdminPassword();
}

module.exports = { updateAdminPassword };
