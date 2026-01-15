require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

async function addPerformanceIndexes() {
  console.log("Starting to add performance indexes...");

  try {
    // Add index on listings(user_id, created_at) for faster seller product queries
    console.log("Creating index on listings(user_id, created_at)...");
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_user_created 
      ON listings(user_id, created_at DESC)
    `;

    // Add index on listings(category_id) for faster category queries
    console.log("Creating index on listings(category_id)...");
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_category 
      ON listings(category_id)
    `;

    // Add index on listings(status) for faster status filtering
    console.log("Creating index on listings(status)...");
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_status 
      ON listings(status)
    `;

    // Add composite index for common query patterns
    console.log(
      "Creating composite index on listings(user_id, status, created_at)..."
    );
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_user_status_created 
      ON listings(user_id, status, created_at DESC)
    `;

    // Add index on listings(created_at) for general date sorting
    console.log("Creating index on listings(created_at)...");
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_created 
      ON listings(created_at DESC)
    `;

    // Messaging-related indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_sender 
      ON messages(sender_id, created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_receiver 
      ON messages(receiver_id, is_read, created_at DESC)
    `;

    console.log("All indexes created successfully!");

    // Analyze tables to update statistics
    console.log("Analyzing tables to update query planner statistics...");
    await sql`ANALYZE listings`;
    await sql`ANALYZE messages`;

    console.log("Database optimization complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding indexes:", error);
    process.exit(1);
  }
}

addPerformanceIndexes();
