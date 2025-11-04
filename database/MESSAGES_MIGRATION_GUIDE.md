# Messages Table Migration Guide

## Overview
This guide explains how to create the `messages` table in your Neon PostgreSQL database to enable the in-app messaging feature.

## Prerequisites
- Access to Neon PostgreSQL database console
- Database connection string from your Neon dashboard

## Migration File
The migration SQL file is located at: `database/migrations/create_messages_table.sql`

## Option 1: Using Neon Console (Recommended)

1. **Login to Neon Dashboard**
   - Go to https://console.neon.tech/
   - Login with your credentials
   - Select your project: `ep-dark-hat-ad5h8dd0`

2. **Open SQL Editor**
   - Click on your database in the dashboard
   - Navigate to "SQL Editor" tab
   - Click "New Query"

3. **Run the Migration**
   - Copy the contents of `database/migrations/create_messages_table.sql`
   - Paste into the SQL Editor
   - Click "Run" button
   - Wait for confirmation message

4. **Verify Table Creation**
   ```sql
   -- Run this query to verify the table was created
   SELECT table_name, column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'messages' 
   ORDER BY ordinal_position;
   ```

5. **Check Indexes**
   ```sql
   -- Verify indexes were created
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'messages';
   ```

## Option 2: Using psql Command Line

1. **Connect to Database**
   ```bash
   psql "postgresql://neondb_owner:your_password@ep-dark-hat-ad5h8dd0.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

2. **Run Migration File**
   ```bash
   \i database/migrations/create_messages_table.sql
   ```

3. **Verify Creation**
   ```bash
   \d messages
   ```

## Option 3: Using Node.js Script

Create a temporary migration script:

```javascript
// runMigration.js
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Running messages table migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database/migrations/create_messages_table.sql'),
      'utf8'
    );
    
    await sql(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify table exists
    const result = await sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'messages'
    `;
    
    console.log('Messages table exists:', result[0].count > 0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
```

Run with:
```bash
cd backend
node runMigration.js
```

## Table Schema

### Columns
- `id` (UUID, PRIMARY KEY) - Unique message identifier
- `sender_id` (UUID, NOT NULL) - References users(id)
- `receiver_id` (UUID, NOT NULL) - References users(id)
- `subject` (VARCHAR(255)) - Message subject/title
- `message` (TEXT, NOT NULL) - Message body content
- `parent_message_id` (UUID) - References messages(id) for replies
- `listing_id` (UUID) - Optional product listing reference
- `property_id` (UUID) - Optional property listing reference
- `job_id` (UUID) - Optional job listing reference
- `attachments` (JSONB) - JSON array of attachment URLs
- `read` (BOOLEAN, DEFAULT FALSE) - Message read status
- `deleted_by_sender` (UUID) - Soft delete by sender
- `deleted_by_receiver` (UUID) - Soft delete by receiver
- `created_at` (TIMESTAMP) - Message creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

### Indexes
- `idx_messages_sender` - Index on sender_id for quick sender queries
- `idx_messages_receiver` - Index on receiver_id for quick receiver queries
- `idx_messages_created` - Descending index on created_at for sorting
- `idx_messages_read` - Partial index on unread messages
- `idx_messages_conversation` - Composite index for conversation queries

## Testing After Migration

### 1. Check Table Exists
```sql
SELECT * FROM messages LIMIT 1;
```
Should return no rows (empty table) but not an error.

### 2. Test Insert
```sql
-- Replace with actual user IDs from your users table
INSERT INTO messages (sender_id, receiver_id, subject, message)
VALUES (
  'your-sender-user-id',
  'your-receiver-user-id',
  'Test Subject',
  'Test message content'
)
RETURNING *;
```

### 3. Test Backend API
1. Redeploy backend to Render (it will pick up the changes automatically)
2. Login to https://vconect.vercel.app
3. Navigate to Account → Messages tab
4. Should see "No messages yet" instead of error
5. Send a test message from a product detail page
6. Check Messages tab - message should appear

## Rollback (If Needed)

If you need to remove the table:

```sql
-- Drop the table and all its data
DROP TABLE IF EXISTS messages CASCADE;
```

## Troubleshooting

### Error: "relation 'messages' already exists"
The table already exists. Check if it has the correct structure:
```sql
\d messages
```

### Error: "relation 'users' does not exist"
The users table doesn't exist. You need to create it first or modify the foreign key references.

### Error: Permission denied
You don't have permission to create tables. Contact your database administrator or check your Neon user permissions.

### Backend Still Shows Error
1. Verify table was created in correct database
2. Check DATABASE_URL environment variable in Render
3. Restart backend service in Render dashboard
4. Clear browser cache and reload frontend

## Post-Migration Checklist

- [ ] Table created successfully
- [ ] All indexes created
- [ ] Backend redeployed to Render
- [ ] Messages tab loads without error
- [ ] Can send messages from product pages
- [ ] Messages appear in Messages tab
- [ ] WhatsApp integration works
- [ ] Mark as read functionality works
- [ ] Message deletion works

## Next Steps

After successful migration:

1. **Test Messaging Flow**
   - Send message from buyer to seller
   - Reply to message
   - Check both inboxes
   - Test WhatsApp links

2. **Monitor Logs**
   - Check Render logs for any errors
   - Monitor Neon database metrics
   - Watch for performance issues

3. **Update Documentation**
   - Document messaging feature for users
   - Update API documentation
   - Add to feature list

## Support

If you encounter issues:
1. Check backend logs in Render dashboard
2. Check browser console for frontend errors
3. Verify database connection string
4. Check Neon database status

## Related Files
- Backend: `backend/src/repositories/messageRepository.js`
- Frontend: `src/components/MessagesView.tsx`
- API: `backend/src/controllers/buyerController.js`
- Service: `backend/src/services/buyers/messageService.js`
