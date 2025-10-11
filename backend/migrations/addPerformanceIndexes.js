require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function addPerformanceIndexes() {
  console.log('Starting to add performance indexes...');

  try {
    // Add index on listings(user_id, created_at) for faster seller product queries
    console.log('Creating index on listings(user_id, created_at)...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_user_created 
      ON listings(user_id, created_at DESC)
    `;

    // Add index on listings(category_id) for faster category queries
    console.log('Creating index on listings(category_id)...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_category 
      ON listings(category_id)
    `;

    // Add index on listings(status) for faster status filtering
    console.log('Creating index on listings(status)...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_status 
      ON listings(status)
    `;

    // Add composite index for common query patterns
    console.log('Creating composite index on listings(user_id, status, created_at)...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_user_status_created 
      ON listings(user_id, status, created_at DESC)
    `;

    // Add index on listings(created_at) for general date sorting
    console.log('Creating index on listings(created_at)...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_created 
      ON listings(created_at DESC)
    `;

    // Indexes for user type specific tables
    console.log('Creating indexes for user-specific tables...');
    
    // Tutor-related indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_tutor 
      ON tutoring_sessions(tutor_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tutor_bookings_student 
      ON tutor_bookings(student_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tutor_bookings_session 
      ON tutor_bookings(session_id, status)
    `;

    // Property-related indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_properties_landlord 
      ON properties(landlord_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_property_viewings_tenant 
      ON property_viewings(tenant_id, created_at DESC)
    `;

    // Job-related indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_job_postings_employer 
      ON job_postings(employer_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_job_applications_applicant 
      ON job_applications(applicant_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_job_applications_posting 
      ON job_applications(job_id, status)
    `;

    // Medical-related indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_medical_services_doctor 
      ON medical_services(doctor_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_medical_appointments_patient 
      ON medical_appointments(patient_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_medical_appointments_service 
      ON medical_appointments(service_id, status)
    `;

    // Buyer-related indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_wishlists_user 
      ON wishlists(user_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist 
      ON wishlist_items(wishlist_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_sender 
      ON messages(sender_id, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_receiver 
      ON messages(receiver_id, is_read, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user 
      ON notifications(user_id, is_read, created_at DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user 
      ON user_reviews(reviewed_user_id, review_type, created_at DESC)
    `;

    console.log('All indexes created successfully!');
    
    // Analyze tables to update statistics
    console.log('Analyzing tables to update query planner statistics...');
    await sql`ANALYZE listings`;
    await sql`ANALYZE tutoring_sessions`;
    await sql`ANALYZE properties`;
    await sql`ANALYZE job_postings`;
    await sql`ANALYZE medical_services`;
    await sql`ANALYZE wishlists`;
    await sql`ANALYZE messages`;
    await sql`ANALYZE notifications`;
    await sql`ANALYZE user_reviews`;
    
    console.log('Database optimization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding indexes:', error);
    process.exit(1);
  }
}

addPerformanceIndexes();
