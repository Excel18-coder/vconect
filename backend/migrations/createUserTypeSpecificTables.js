const { sql } = require('../src/config/database');

const createUserTypeSpecificTables = async () => {
  try {
    console.log('🔧 Creating user-type specific tables...');

    // ============= TUTOR TABLES =============
    
    // Tutors profile extension
    await sql`
      CREATE TABLE IF NOT EXISTS tutor_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        specializations TEXT[] NOT NULL,
        qualifications TEXT[],
        years_of_experience INTEGER,
        hourly_rate DECIMAL(10,2),
        available_hours JSONB, -- {monday: ['9:00-12:00', '14:00-17:00'], ...}
        teaching_mode VARCHAR(50)[] CHECK (teaching_mode <@ ARRAY['online', 'in-person', 'hybrid']::VARCHAR[]),
        languages_spoken TEXT[],
        certifications TEXT[],
        rating DECIMAL(3,2) DEFAULT 0,
        total_students INTEGER DEFAULT 0,
        total_sessions INTEGER DEFAULT 0,
        bio TEXT,
        video_intro_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created tutor_profiles table');

    // Tutoring sessions/courses
    await sql`
      CREATE TABLE IF NOT EXISTS tutoring_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject VARCHAR(100) NOT NULL,
        level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
        session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('one-on-one', 'group', 'course')),
        duration_minutes INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        max_students INTEGER DEFAULT 1,
        mode VARCHAR(50) NOT NULL CHECK (mode IN ('online', 'in-person', 'hybrid')),
        location VARCHAR(255),
        materials_included TEXT[],
        prerequisites TEXT,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full', 'completed')),
        images TEXT[],
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created tutoring_sessions table');

    // Tutor bookings
    await sql`
      CREATE TABLE IF NOT EXISTS tutor_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
        tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
        total_amount DECIMAL(10,2) NOT NULL,
        meeting_link TEXT,
        notes TEXT,
        student_notes TEXT,
        tutor_notes TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created tutor_bookings table');

    // ============= LANDLORD TABLES =============

    // Landlord profile extension
    await sql`
      CREATE TABLE IF NOT EXISTS landlord_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        company_name VARCHAR(255),
        license_number VARCHAR(100),
        years_in_business INTEGER,
        total_properties INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT false,
        insurance_details JSONB,
        emergency_contact JSONB,
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created landlord_profiles table');

    // Properties
    await sql`
      CREATE TABLE IF NOT EXISTS properties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('apartment', 'house', 'studio', 'villa', 'commercial', 'land', 'office')),
        listing_type VARCHAR(50) NOT NULL CHECK (listing_type IN ('rent', 'sale', 'lease')),
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        coordinates JSONB, -- {lat: x, lng: y}
        price DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        bedrooms INTEGER,
        bathrooms INTEGER,
        area_sqft INTEGER,
        floor_number INTEGER,
        total_floors INTEGER,
        parking_spaces INTEGER,
        furnished BOOLEAN DEFAULT false,
        pets_allowed BOOLEAN DEFAULT false,
        amenities TEXT[], -- ['wifi', 'pool', 'gym', 'security', etc.]
        utilities_included TEXT[],
        images TEXT[],
        video_tour_url TEXT,
        virtual_tour_url TEXT,
        available_from DATE,
        lease_duration VARCHAR(50),
        deposit_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'sold', 'maintenance', 'inactive')),
        views_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created properties table');

    // Property viewings/inquiries
    await sql`
      CREATE TABLE IF NOT EXISTS property_viewings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        viewing_date DATE NOT NULL,
        viewing_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
        notes TEXT,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created property_viewings table');

    // ============= EMPLOYER TABLES =============

    // Employer profile extension
    await sql`
      CREATE TABLE IF NOT EXISTS employer_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        company_name VARCHAR(255) NOT NULL,
        company_logo TEXT,
        industry VARCHAR(100),
        company_size VARCHAR(50), -- '1-10', '11-50', '51-200', etc.
        founded_year INTEGER,
        website TEXT,
        company_description TEXT,
        headquarters VARCHAR(255),
        registration_number VARCHAR(100),
        verified BOOLEAN DEFAULT false,
        rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        total_jobs_posted INTEGER DEFAULT 0,
        social_links JSONB, -- {linkedin: '', twitter: '', etc.}
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created employer_profiles table');

    // Job postings
    await sql`
      CREATE TABLE IF NOT EXISTS job_postings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        responsibilities TEXT[],
        requirements TEXT[],
        qualifications TEXT[],
        employment_type VARCHAR(50) NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
        experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
        category VARCHAR(100) NOT NULL,
        industry VARCHAR(100),
        location VARCHAR(255) NOT NULL,
        remote_type VARCHAR(50) DEFAULT 'on-site' CHECK (remote_type IN ('on-site', 'remote', 'hybrid')),
        salary_min DECIMAL(12,2),
        salary_max DECIMAL(12,2),
        salary_currency VARCHAR(3) DEFAULT 'KES',
        salary_period VARCHAR(20) DEFAULT 'monthly', -- 'hourly', 'monthly', 'yearly'
        benefits TEXT[],
        application_deadline DATE,
        positions_available INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'filled', 'inactive')),
        views_count INTEGER DEFAULT 0,
        applications_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created job_postings table');

    // Job applications
    await sql`
      CREATE TABLE IF NOT EXISTS job_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
        employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cover_letter TEXT,
        resume_url TEXT NOT NULL,
        portfolio_url TEXT,
        expected_salary DECIMAL(12,2),
        available_from DATE,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn')),
        notes TEXT,
        employer_notes TEXT,
        interview_date TIMESTAMP,
        interview_location TEXT,
        interview_mode VARCHAR(50), -- 'in-person', 'video', 'phone'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_id, applicant_id)
      )
    `;
    console.log('✅ Created job_applications table');

    // ============= DOCTOR/HEALTHCARE TABLES =============

    // Doctor profile extension
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        medical_license_number VARCHAR(100) NOT NULL,
        specialization VARCHAR(100) NOT NULL,
        subspecialties TEXT[],
        qualifications TEXT[] NOT NULL,
        years_of_experience INTEGER,
        consultation_fee DECIMAL(10,2),
        hospital_affiliations TEXT[],
        clinic_name VARCHAR(255),
        clinic_address TEXT,
        consultation_mode VARCHAR(50)[] CHECK (consultation_mode <@ ARRAY['in-person', 'video', 'phone']::VARCHAR[]),
        languages_spoken TEXT[],
        insurance_accepted TEXT[],
        rating DECIMAL(3,2) DEFAULT 0,
        total_patients INTEGER DEFAULT 0,
        total_consultations INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT false,
        bio TEXT,
        availability_hours JSONB,
        emergency_available BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created doctor_profiles table');

    // Medical services offered
    await sql`
      CREATE TABLE IF NOT EXISTS medical_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service_name VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INTEGER,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        service_type VARCHAR(50) CHECK (service_type IN ('consultation', 'checkup', 'procedure', 'therapy', 'diagnosis', 'follow-up')),
        mode VARCHAR(50) NOT NULL CHECK (mode IN ('in-person', 'video', 'phone')),
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created medical_services table');

    // Appointments
    await sql`
      CREATE TABLE IF NOT EXISTS medical_appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_id UUID REFERENCES medical_services(id) ON DELETE SET NULL,
        doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        duration_minutes INTEGER NOT NULL,
        consultation_mode VARCHAR(50) NOT NULL CHECK (consultation_mode IN ('in-person', 'video', 'phone')),
        reason TEXT,
        symptoms TEXT,
        status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled', 'no-show')),
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
        total_amount DECIMAL(10,2) NOT NULL,
        meeting_link TEXT,
        prescription TEXT,
        diagnosis TEXT,
        notes TEXT,
        follow_up_required BOOLEAN DEFAULT false,
        follow_up_date DATE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created medical_appointments table');

    // ============= BUYER TABLES =============

    // Buyer wishlist
    await sql`
      CREATE TABLE IF NOT EXISTS wishlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) DEFAULT 'My Wishlist',
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created wishlists table');

    // Wishlist items
    await sql`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
        listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
        notes TEXT,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (
          (listing_id IS NOT NULL AND property_id IS NULL AND job_id IS NULL) OR
          (listing_id IS NULL AND property_id IS NOT NULL AND job_id IS NULL) OR
          (listing_id IS NULL AND property_id IS NULL AND job_id IS NOT NULL)
        )
      )
    `;
    console.log('✅ Created wishlist_items table');

    // User notifications
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'booking', 'message', 'review', 'payment', etc.
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        action_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created notifications table');

    // Messages/Chat
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
        listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
        property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
        job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
        attachments TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created messages table');

    // Reviews (universal)
    await sql`
      CREATE TABLE IF NOT EXISTS user_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        review_type VARCHAR(50) NOT NULL, -- 'tutor', 'landlord', 'employer', 'doctor', 'seller', 'buyer'
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_title VARCHAR(255),
        review_text TEXT,
        booking_id UUID, -- Could reference tutor_bookings, property_viewings, medical_appointments, etc.
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(reviewer_id, reviewed_user_id, booking_id)
      )
    `;
    console.log('✅ Created user_reviews table');

    // Create indexes
    console.log('📊 Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_tutor_profiles_user_id ON tutor_profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_tutor_id ON tutoring_sessions(tutor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_status ON tutoring_sessions(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tutor_bookings_tutor_id ON tutor_bookings(tutor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tutor_bookings_student_id ON tutor_bookings(student_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_landlord_profiles_user_id ON landlord_profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_property_viewings_property_id ON property_viewings(property_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON employer_profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_job_postings_employer_id ON job_postings(employer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_job_postings_location ON job_postings(location)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON doctor_profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_medical_services_doctor_id ON medical_services(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_medical_appointments_doctor_id ON medical_appointments(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_medical_appointments_patient_id ON medical_appointments(patient_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewed_user_id ON user_reviews(reviewed_user_id)`;

    console.log('✅ All indexes created');

    console.log('\n✨ User-type specific tables created successfully!');
    console.log('📋 Created Tables:');
    console.log('   👨‍🏫 Tutor: tutor_profiles, tutoring_sessions, tutor_bookings');
    console.log('   🏠 Landlord: landlord_profiles, properties, property_viewings');
    console.log('   💼 Employer: employer_profiles, job_postings, job_applications');
    console.log('   👨‍⚕️ Doctor: doctor_profiles, medical_services, medical_appointments');
    console.log('   🛍️ Buyer: wishlists, wishlist_items');
    console.log('   📱 Universal: notifications, messages, user_reviews');

  } catch (error) {
    console.error('❌ Failed to create user-type specific tables:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  createUserTypeSpecificTables()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createUserTypeSpecificTables };
