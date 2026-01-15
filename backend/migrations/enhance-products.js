const { sql } = require('../src/config/database');

const enhanceProductSchema = async () => {
  try {
    console.log('🔧 Enhancing product management schema...');

    // Enhance listings table with additional seller features
    await sql`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS product_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
      ADD COLUMN IF NOT EXISTS model VARCHAR(100),
      ADD COLUMN IF NOT EXISTS color VARCHAR(50),
      ADD COLUMN IF NOT EXISTS size VARCHAR(50),
      ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2),
      ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100),
      ADD COLUMN IF NOT EXISTS material VARCHAR(100),
      ADD COLUMN IF NOT EXISTS warranty_period INTEGER,
      ADD COLUMN IF NOT EXISTS warranty_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS max_order_quantity INTEGER,
      ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS tags TEXT[],
      ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS seo_description TEXT,
      ADD COLUMN IF NOT EXISTS shipping_included BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(8,2),
      ADD COLUMN IF NOT EXISTS return_policy TEXT,
      ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS download_url TEXT,
      ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0
    `;
    console.log('✅ Enhanced listings table with seller features');

    // Create product variants table for different options (size, color, etc.)
    await sql`
      CREATE TABLE IF NOT EXISTS product_variants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        variant_name VARCHAR(100) NOT NULL,
        variant_value VARCHAR(100) NOT NULL,
        price_adjustment DECIMAL(10,2) DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        sku VARCHAR(100),
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created product_variants table');

    // Create product reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_title VARCHAR(255),
        review_text TEXT,
        is_verified_purchase BOOLEAN DEFAULT false,
        helpful_count INTEGER DEFAULT 0,
        images TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(listing_id, user_id)
      )
    `;
    console.log('✅ Created product_reviews table');

    // Create seller analytics table
    await sql`
      CREATE TABLE IF NOT EXISTS seller_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL, -- 'view', 'favorite', 'inquiry', 'sale'
        event_data JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created seller_analytics table');

    // Create orders table for purchase tracking
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        shipping_cost DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        final_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        payment_method VARCHAR(50),
        shipping_address JSONB,
        billing_address JSONB,
        notes TEXT,
        estimated_delivery DATE,
        actual_delivery DATE,
        tracking_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created orders table');

    // Create saved searches table for buyers
    await sql`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        search_name VARCHAR(100) NOT NULL,
        search_query VARCHAR(255),
        category_id UUID REFERENCES categories(id),
        min_price DECIMAL(10,2),
        max_price DECIMAL(10,2),
        location VARCHAR(255),
        condition VARCHAR(20),
        filters JSONB,
        alert_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created saved_searches table');

    // Add indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_status_active ON listings(status) WHERE status = 'active'`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_created_at_desc ON listings(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings(category_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_listings_tags ON listings USING GIN(tags)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_product_variants_listing_id ON product_variants(listing_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_product_reviews_listing_id ON product_reviews(listing_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_seller_analytics_user_id ON seller_analytics(user_id)`;
    console.log('✅ Created indexes for better performance');

    // Create triggers for automatic timestamp updates
    await sql`DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants`;
    await sql`
      CREATE TRIGGER update_product_variants_updated_at
        BEFORE UPDATE ON product_variants
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews`;
    await sql`
      CREATE TRIGGER update_product_reviews_updated_at
        BEFORE UPDATE ON product_reviews
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_orders_updated_at ON orders`;
    await sql`
      CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches`;
    await sql`
      CREATE TRIGGER update_saved_searches_updated_at
        BEFORE UPDATE ON saved_searches
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('✅ Product management schema enhancement completed successfully!');
    console.log('📋 Enhanced Tables:');
    console.log('   - listings (enhanced with seller features)');
    console.log('   - product_variants (for different product options)');
    console.log('   - product_reviews (customer reviews and ratings)');
    console.log('   - seller_analytics (track seller performance)');
    console.log('   - orders (purchase and order management)');
    console.log('   - saved_searches (buyer search preferences)');

  } catch (error) {
    console.error('❌ Product schema enhancement failed:', error);
    throw error;
  }
};

// Run enhancement if called directly
if (require.main === module) {
  enhanceProductSchema()
    .then(() => {
      console.log('Product schema enhancement completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Product schema enhancement failed:', error);
      process.exit(1);
    });
}

module.exports = { enhanceProductSchema };
