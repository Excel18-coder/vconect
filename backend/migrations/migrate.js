const { sql } = require("../src/config/database");

const createTables = async () => {
  try {
    console.log("🚀 Starting database migration...");

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        display_name VARCHAR(255),
        avatar_url TEXT,
        bio TEXT,
        user_type VARCHAR(50) DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'seller', 'landlord', 'admin')),
        phone_number VARCHAR(20),
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create categories table for marketplace items
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon_url TEXT,
        parent_id UUID REFERENCES categories(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create listings table
    await sql`
      CREATE TABLE IF NOT EXISTS listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES categories(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'KES',
        condition VARCHAR(20) CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive', 'pending')),
        images TEXT[], -- Array of image URLs
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        negotiable BOOLEAN DEFAULT true,
        featured BOOLEAN DEFAULT false,
        views_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create favorites table
    await sql`
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, listing_id)
      )
    `;

    // Create messages table for user communication
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create sessions table for authentication
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)`;

    // Create trigger function for updating timestamps
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Create triggers for automatic timestamp updates (separate statements)
    await sql`DROP TRIGGER IF EXISTS update_users_updated_at ON users`;
    await sql`
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles`;
    await sql`
      CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_categories_updated_at ON categories`;
    await sql`
      CREATE TRIGGER update_categories_updated_at
        BEFORE UPDATE ON categories
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_listings_updated_at ON listings`;
    await sql`
      CREATE TRIGGER update_listings_updated_at
        BEFORE UPDATE ON listings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log("✅ Database migration completed successfully!");
    console.log("📋 Tables created:");
    console.log("   - users");
    console.log("   - profiles");
    console.log("   - categories");
    console.log("   - listings");
    console.log("   - favorites");
    console.log("   - messages");
    console.log("   - user_sessions");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { createTables };
