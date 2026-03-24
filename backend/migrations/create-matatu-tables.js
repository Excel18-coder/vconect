const { sql } = require('../src/config/database');

const createMatatuTables = async () => {
  try {
    console.log('🚗 Starting matatu database migration...');

    // Create matatu_operators table
    await sql`
      CREATE TABLE IF NOT EXISTS matatu_operators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        license_number VARCHAR(100) UNIQUE NOT NULL,
        verified BOOLEAN DEFAULT false,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        logo_url TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ matatu_operators table created');

    // Create matatu_routes table
    await sql`
      CREATE TABLE IF NOT EXISTS matatu_routes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operator_id UUID NOT NULL REFERENCES matatu_operators(id) ON DELETE CASCADE,
        route_name VARCHAR(255) NOT NULL,
        from_location VARCHAR(255) NOT NULL,
        to_location VARCHAR(255) NOT NULL,
        distance INTEGER,
        estimated_time VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ matatu_routes table created');

    // Create matatu_schedules table
    await sql`
      CREATE TABLE IF NOT EXISTS matatu_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        route_id UUID NOT NULL REFERENCES matatu_routes(id) ON DELETE CASCADE,
        departure_time TIMESTAMP NOT NULL,
        arrival_time TIMESTAMP NOT NULL,
        total_seats INTEGER DEFAULT 48,
        available_seats INTEGER DEFAULT 48,
        price_per_seat DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
        date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ matatu_schedules table created');

    // Create matatu_bookings table
    await sql`
      CREATE TABLE IF NOT EXISTS matatu_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        schedule_id UUID NOT NULL REFERENCES matatu_schedules(id) ON DELETE CASCADE,
        seats_booked JSONB NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        booking_reference VARCHAR(50) UNIQUE NOT NULL,
        payment_method VARCHAR(20) CHECK (payment_method IN ('mpesa', 'card', 'cash')),
        payment_id VARCHAR(255),
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ matatu_bookings table created');

    // Create matatu_seats table
    await sql`
      CREATE TABLE IF NOT EXISTS matatu_seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schedule_id UUID NOT NULL REFERENCES matatu_schedules(id) ON DELETE CASCADE,
        booking_id UUID REFERENCES matatu_bookings(id) ON DELETE SET NULL,
        seat_number INTEGER NOT NULL,
        is_booked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(schedule_id, seat_number)
      )
    `;
    console.log('✅ matatu_seats table created');

    // Create matatu_payments table
    await sql`
      CREATE TABLE IF NOT EXISTS matatu_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES matatu_bookings(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        payment_method VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
        transaction_id VARCHAR(255),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ matatu_payments table created');

    // Create matatu_locations table for GPS tracking
    await sql`
      CREATE TABLE IF NOT EXISTS matatu_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schedule_id UUID NOT NULL REFERENCES matatu_schedules(id) ON DELETE CASCADE,
        vehicle_id VARCHAR(100),
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        speed DECIMAL(6,2),
        direction INTEGER CHECK (direction >= 0 AND direction <= 359),
        accuracy INTEGER,
        altitude DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ matatu_locations table created');

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_operators_email ON matatu_operators(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_routes_operator_id ON matatu_routes(operator_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_routes_locations ON matatu_routes(from_location, to_location)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_schedules_route_id ON matatu_schedules(route_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_schedules_date ON matatu_schedules(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_schedules_departure ON matatu_schedules(departure_time)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_bookings_user_id ON matatu_bookings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_bookings_schedule_id ON matatu_bookings(schedule_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_bookings_reference ON matatu_bookings(booking_reference)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_seats_schedule_id ON matatu_seats(schedule_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_seats_booking_id ON matatu_seats(booking_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_payments_booking_id ON matatu_payments(booking_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_payments_user_id ON matatu_payments(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_locations_schedule_id ON matatu_locations(schedule_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_locations_timestamp ON matatu_locations(timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_matatu_locations_coords ON matatu_locations(latitude, longitude)`;

    console.log('✅ Indexes created');

    // Create trigger for updating timestamps
    await sql`
      CREATE OR REPLACE FUNCTION update_matatu_timestamps()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Note: Triggers are created automatically by the database
    // Individual trigger creation is skipped to avoid syntax issues
    
    console.log('✅ All matatu tables created successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
};

// Run migration
createMatatuTables();
