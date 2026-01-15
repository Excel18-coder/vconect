# Admin User Setup Guide

## Creating Your First Admin User

Since this is a new admin system, you'll need to manually create at least one admin user in the database.

### Method 1: Using Database GUI (Recommended)

If you're using a database management tool like pgAdmin, TablePlus, or Neon Console:

1. **Connect to your database**

2. **Run this SQL query** (replace with your user's ID):

   ```sql
   -- First, find your user ID
   SELECT u.id, u.email, p.user_type
   FROM users u
   JOIN profiles p ON u.id = p.user_id
   WHERE u.email = 'your-email@example.com';

   -- Then update the user type to admin
   UPDATE profiles
   SET user_type = 'admin'
   WHERE user_id = 'your-user-id-from-above';
   ```

3. **Verify the update**:
   ```sql
   SELECT u.email, p.user_type
   FROM users u
   JOIN profiles p ON u.id = p.user_id
   WHERE p.user_type = 'admin';
   ```

### Method 2: Using Backend Script

Create a script file `backend/scripts/createAdmin.js`:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createAdmin(email) {
  const client = await pool.connect();
  try {
    // Find user by email
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      console.error(`User with email ${email} not found`);
      return;
    }

    const userId = userResult.rows[0].id;

    // Update user type to admin
    await client.query('UPDATE profiles SET user_type = $1 WHERE user_id = $2', ['admin', userId]);

    console.log(`✅ Successfully made ${email} an admin!`);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node createAdmin.js <email>');
  process.exit(1);
}

createAdmin(email);
```

Then run:

```bash
cd backend
node scripts/createAdmin.js your-email@example.com
```

### Method 3: Direct psql Command

If you have psql installed:

```bash
# Connect to your database
psql "your-database-connection-string"

# Run the update
UPDATE profiles SET user_type = 'admin'
WHERE user_id = (
  SELECT id FROM users WHERE email = 'your-email@example.com'
);
```

## Accessing the Admin Panel

Once you've created an admin user:

1. **Login** to the application with your admin account
2. Click on your **avatar** in the top right corner
3. Select **"Admin Panel"** from the dropdown menu
4. Or directly navigate to: `https://your-domain.com/admin`

## Troubleshooting

### "Access Denied" Error

- Verify your user_type is set to 'admin' in the database
- Log out and log back in to refresh your session
- Check browser console for any errors

### Admin Panel Not Showing

- Make sure you've logged in (not just signed up)
- Verify the profile has user_type = 'admin'
- Clear browser cache and cookies

### Database Connection Issues

- Check DATABASE_URL environment variable
- Verify database is running
- Check firewall/security group settings

## Security Notes

⚠️ **Important Security Considerations:**

1. **Limit Admin Accounts**: Only create admin accounts for trusted users
2. **Use Strong Passwords**: Admins have full system access
3. **Monitor Admin Activity**: Check activity logs regularly
4. **Backup Before Changes**: Always backup before bulk operations
5. **Production Caution**: Be extra careful when making changes in production

## Next Steps

After creating your admin user:

1. ✅ Test the admin dashboard
2. ✅ Verify all tabs work (Overview, Users, Products, Activity)
3. ✅ Test user management features
4. ✅ Test product management features
5. ✅ Check activity logs are recording properly

## Support

If you encounter any issues:

- Check the browser console for errors
- Check backend logs for API errors
- Verify JWT_SECRET is set in environment variables
- Ensure database migrations are up to date

---

**Need Help?** Check the main [ADMIN_SYSTEM_COMPLETE.md](./ADMIN_SYSTEM_COMPLETE.md) documentation for detailed information about all admin features.
