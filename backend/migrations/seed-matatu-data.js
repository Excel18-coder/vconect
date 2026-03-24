const { sql } = require('../src/config/database');

const seedMatatuData = async () => {
  try {
    console.log('🌱 Seeding matatu operators and routes...');

    // Check if operators already exist
    const existingOperators = await sql`
      SELECT COUNT(*) as count FROM matatu_operators
    `;

    if (existingOperators[0].count > 0) {
      console.log('✅ Matatu data already seeded. Skipping...');
      process.exit(0);
      return;
    }

    // Seed matatu operators
    const operators = [
      {
        name: 'East Africa Safaris',
        email: 'info@easafaris.co.ke',
        phone: '+254712345678',
        license: 'EAS001',
        rating: 4.8,
        description: 'Premium matatu service with comfortable seating and WiFi',
      },
      {
        name: 'Nairobi Express',
        email: 'bookings@nairobiexpress.com',
        phone: '+254722334455',
        license: 'NAE002',
        rating: 4.6,
        description: 'Fast and reliable service connecting major cities',
      },
      {
        name: 'Coast Line Transport',
        email: 'info@coastline.co.ke',
        phone: '+254733445566',
        license: 'CLT003',
        rating: 4.5,
        description: 'Serving the coastal routes with excellence',
      },
      {
        name: 'Western Travels',
        email: 'bookings@westerntravel.com',
        phone: '+254744556677',
        license: 'WWT004',
        rating: 4.7,
        description: 'Connecting western Kenya to major hubs',
      },
      {
        name: 'Quick Pass Shuttles',
        email: 'info@quickpass.co.ke',
        phone: '+254755667788',
        license: 'QPS005',
        rating: 4.4,
        description: 'Budget-friendly and efficient transport solutions',
      },
    ];

    const operatorIds = [];

    for (const op of operators) {
      const result = await sql`
        INSERT INTO matatu_operators (name, email, phone, license_number, verified, rating, description)
        VALUES (${op.name}, ${op.email}, ${op.phone}, ${op.license}, true, ${op.rating}, ${op.description})
        RETURNING id
      `;
      operatorIds.push(result[0].id);
      console.log(`✅ Operator: ${op.name}`);
    }

    // Define routes
    const routes = [
      // Nairobi routes
      { operator_idx: 0, name: 'Nairobi - Mombasa', from: 'Nairobi', to: 'Mombasa', distance: 488 },
      { operator_idx: 1, name: 'Nairobi - Kisumu', from: 'Nairobi', to: 'Kisumu', distance: 382 },
      { operator_idx: 2, name: 'Nairobi - Nakuru', from: 'Nairobi', to: 'Nakuru', distance: 162 },
      { operator_idx: 0, name: 'Nairobi - Kericho', from: 'Nairobi', to: 'Kericho', distance: 232 },
      { operator_idx: 1, name: 'Nairobi - Eldoret', from: 'Nairobi', to: 'Eldoret', distance: 323 },

      // Mombasa routes
      { operator_idx: 2, name: 'Mombasa - Nairobi', from: 'Mombasa', to: 'Nairobi', distance: 488 },
      { operator_idx: 1, name: 'Mombasa - Malindi', from: 'Mombasa', to: 'Malindi', distance: 120 },

      // Kisumu routes
      { operator_idx: 1, name: 'Kisumu - Nairobi', from: 'Kisumu', to: 'Nairobi', distance: 382 },
      { operator_idx: 3, name: 'Kisumu - Kericho', from: 'Kisumu', to: 'Kericho', distance: 150 },

      // Western routes
      { operator_idx: 3, name: 'Nakuru - Nairobi', from: 'Nakuru', to: 'Nairobi', distance: 162 },
      { operator_idx: 4, name: 'Eldoret - Nairobi', from: 'Eldoret', to: 'Nairobi', distance: 323 },
      { operator_idx: 3, name: 'Kisii - Nairobi', from: 'Kisii', to: 'Nairobi', distance: 292 },

      // Coastal routes
      { operator_idx: 2, name: 'Malindi - Mombasa', from: 'Malindi', to: 'Mombasa', distance: 120 },
      { operator_idx: 2, name: 'Diani - Mombasa', from: 'Diani', to: 'Mombasa', distance: 45 },
    ];

    for (const route of routes) {
      await sql`
        INSERT INTO matatu_routes (operator_id, route_name, from_location, to_location, distance, estimated_time, is_active)
        VALUES (${operatorIds[route.operator_idx]}, ${route.name}, ${route.from}, ${route.to}, ${route.distance}, '4 hours', true)
      `;
      console.log(`✅ Route: ${route.name}`);
    }

    // Seed schedules for today and next 7 days
    const now = new Date();
    const schedules = [];

    for (let day = 0; day < 7; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);

      const departureTimes = ['06:00', '09:00', '12:00', '15:00', '18:00'];

      for (let i = 1; i <= routes.length; i++) {
        for (const depTime of departureTimes) {
          const [hours, minutes] = depTime.split(':').map(Number);
          const departureTime = new Date(date);
          departureTime.setHours(hours, minutes, 0);

          const arrivalTime = new Date(departureTime);
          arrivalTime.setHours(arrivalTime.getHours() + 4); // Assuming 4-hour average journey

          schedules.push({
            route_id: i,
            departure: departureTime,
            arrival: arrivalTime,
            date: date.toISOString().split('T')[0],
            price: 500 + Math.random() * 500, // Random price between 500-1000
          });
        }
      }
    }

    // Get route IDs
    const allRoutes = await sql`
      SELECT id FROM matatu_routes ORDER BY id
    `;

    for (let i = 0; i < schedules.length && i < allRoutes.length; i++) {
      const schedule = schedules[i];
      const result = await sql`
        INSERT INTO matatu_schedules (
          route_id, departure_time, arrival_time, date, 
          total_seats, available_seats, price_per_seat, status
        ) VALUES (
          ${allRoutes[i % allRoutes.length].id}, 
          ${schedule.departure}, 
          ${schedule.arrival}, 
          ${schedule.date},
          48, 48, ${Math.round(schedule.price)}, 'active'
        )
        RETURNING id
      `;

      // Create 48 seats for each schedule
      const scheduleId = result[0].id;
      for (let seat = 1; seat <= 48; seat++) {
        await sql`
          INSERT INTO matatu_seats (schedule_id, seat_number, is_booked)
          VALUES (${scheduleId}, ${seat}, false)
        `;
      }
    }

    console.log(`✅ Created ${schedules.length} schedules with seats`);
    console.log('✅ Matatu database seeded successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

// Run seeding
seedMatatuData();
