/**
 * Doctor Repository
 * Handles all database operations for doctor profiles
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class DoctorRepository {
  /**
   * Create doctor profile
   */
  async create(doctorData) {
    try {
      const result = await sql`
        INSERT INTO doctor_profiles (
          user_id, medical_license_number, specialization, subspecialties,
          qualifications, years_of_experience, consultation_fee,
          hospital_affiliations, clinic_name, clinic_address,
          consultation_mode, languages_spoken, insurance_accepted,
          bio, availability_hours, emergency_available
        )
        VALUES (
          ${doctorData.user_id}, ${doctorData.medical_license_number}, ${doctorData.specialization}, 
          ${doctorData.subspecialties}, ${doctorData.qualifications}, ${doctorData.years_of_experience},
          ${doctorData.consultation_fee}, ${doctorData.hospital_affiliations}, ${doctorData.clinic_name}, 
          ${doctorData.clinic_address}, ${doctorData.consultation_mode}, ${doctorData.languages_spoken},
          ${doctorData.insurance_accepted}, ${doctorData.bio}, ${doctorData.availability_hours}, 
          ${doctorData.emergency_available}
        )
        RETURNING *
      `;
      
      logger.debug('Doctor profile created in database', { doctorId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create doctor profile', error, doctorData);
      throw error;
    }
  }

  /**
   * Find doctor by user ID
   */
  async findByUserId(userId) {
    try {
      const result = await sql`
        SELECT * FROM doctor_profiles
        WHERE user_id = ${userId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find doctor profile', error, { userId });
      throw error;
    }
  }

  /**
   * Find doctor by user ID with details
   */
  async findByUserIdWithDetails(userId) {
    try {
      const result = await sql`
        SELECT 
          dp.*,
          prof.display_name,
          prof.avatar_url,
          u.email
        FROM doctor_profiles dp
        JOIN users u ON dp.user_id = u.id
        JOIN profiles prof ON dp.user_id = prof.user_id
        WHERE dp.user_id = ${userId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find doctor profile with details', error, { userId });
      throw error;
    }
  }

  /**
   * Search doctors
   */
  async search(filters) {
    try {
      let conditions = [];
      
      if (filters.specialization) {
        conditions.push(sql`dp.specialization ILIKE ${'%' + filters.specialization + '%'}`);
      }
      if (filters.consultation_mode) {
        conditions.push(sql`${filters.consultation_mode} = ANY(dp.consultation_mode)`);
      }
      if (filters.insurance) {
        conditions.push(sql`${filters.insurance} = ANY(dp.insurance_accepted)`);
      }
      if (filters.min_fee !== undefined && filters.min_fee !== null) {
        conditions.push(sql`dp.consultation_fee >= ${filters.min_fee}`);
      }
      if (filters.max_fee !== undefined && filters.max_fee !== null) {
        conditions.push(sql`dp.consultation_fee <= ${filters.max_fee}`);
      }
      if (filters.emergency_available) {
        conditions.push(sql`dp.emergency_available = true`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT 
          dp.*,
          prof.display_name,
          prof.avatar_url,
          u.email
        FROM doctor_profiles dp
        JOIN users u ON dp.user_id = u.id
        JOIN profiles prof ON dp.user_id = prof.user_id
        ${whereClause}
        ORDER BY dp.rating DESC, dp.total_consultations DESC
        LIMIT ${filters.limit} OFFSET ${filters.offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to search doctors', error, filters);
      throw error;
    }
  }

  /**
   * Count search results
   */
  async countSearch(filters) {
    try {
      let conditions = [];
      
      if (filters.specialization) {
        conditions.push(sql`specialization ILIKE ${'%' + filters.specialization + '%'}`);
      }
      if (filters.consultation_mode) {
        conditions.push(sql`${filters.consultation_mode} = ANY(consultation_mode)`);
      }
      if (filters.insurance) {
        conditions.push(sql`${filters.insurance} = ANY(insurance_accepted)`);
      }
      if (filters.min_fee !== undefined && filters.min_fee !== null) {
        conditions.push(sql`consultation_fee >= ${filters.min_fee}`);
      }
      if (filters.max_fee !== undefined && filters.max_fee !== null) {
        conditions.push(sql`consultation_fee <= ${filters.max_fee}`);
      }
      if (filters.emergency_available) {
        conditions.push(sql`emergency_available = true`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT COUNT(*)::INTEGER as count
        FROM doctor_profiles
        ${whereClause}
      `;
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Failed to count search results', error, filters);
      throw error;
    }
  }

  /**
   * Update doctor profile
   */
  async update(userId, updateData) {
    try {
      const result = await sql`
        UPDATE doctor_profiles
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Doctor profile', userId);
      }
      
      logger.debug('Doctor profile updated in database', { userId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update doctor profile', error, { userId });
      throw error;
    }
  }

  /**
   * Increment consultation count
   */
  async incrementConsultationCount(userId) {
    try {
      await sql`
        UPDATE doctor_profiles
        SET total_consultations = total_consultations + 1
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Consultation count incremented', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to increment consultation count', error, { userId });
      throw error;
    }
  }

  /**
   * Increment patient count
   */
  async incrementPatientCount(userId) {
    try {
      await sql`
        UPDATE doctor_profiles
        SET total_patients = total_patients + 1
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Patient count incremented', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to increment patient count', error, { userId });
      throw error;
    }
  }

  /**
   * Update doctor rating
   */
  async updateRating(userId, rating, reviewCount) {
    try {
      await sql`
        UPDATE doctor_profiles
        SET rating = ${rating},
            total_reviews = ${reviewCount}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Doctor rating updated', { userId, rating });
      return true;
    } catch (error) {
      logger.error('Failed to update doctor rating', error, { userId });
      throw error;
    }
  }

  /**
   * Set verification status
   */
  async setVerificationStatus(userId, verified) {
    try {
      await sql`
        UPDATE doctor_profiles
        SET verified = ${verified}
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Doctor verification status updated', { userId, verified });
      return true;
    } catch (error) {
      logger.error('Failed to set verification status', error, { userId });
      throw error;
    }
  }

  /**
   * Get doctor statistics
   */
  async getStatistics(userId) {
    try {
      const result = await sql`
        SELECT 
          dp.total_consultations,
          dp.total_patients,
          dp.rating,
          dp.total_reviews,
          COUNT(DISTINCT ms.id)::INTEGER as total_services,
          COUNT(DISTINCT CASE WHEN ms.status = 'active' THEN ms.id END)::INTEGER as active_services,
          COUNT(DISTINCT ma.id)::INTEGER as total_appointments,
          COUNT(DISTINCT CASE WHEN ma.status = 'pending' THEN ma.id END)::INTEGER as pending_appointments,
          COUNT(DISTINCT CASE WHEN ma.status = 'confirmed' THEN ma.id END)::INTEGER as confirmed_appointments,
          COUNT(DISTINCT CASE WHEN ma.status = 'completed' THEN ma.id END)::INTEGER as completed_appointments
        FROM doctor_profiles dp
        LEFT JOIN medical_services ms ON dp.user_id = ms.doctor_id
        LEFT JOIN medical_appointments ma ON dp.user_id = ma.doctor_id
        WHERE dp.user_id = ${userId}
        GROUP BY dp.user_id, dp.total_consultations, dp.total_patients, dp.rating, dp.total_reviews
      `;
      
      return result[0] || {
        total_consultations: 0,
        total_patients: 0,
        rating: 0,
        total_reviews: 0,
        total_services: 0,
        active_services: 0,
        total_appointments: 0,
        pending_appointments: 0,
        confirmed_appointments: 0,
        completed_appointments: 0
      };
    } catch (error) {
      logger.error('Failed to get doctor statistics', error, { userId });
      throw error;
    }
  }

  /**
   * Delete doctor profile
   */
  async delete(userId) {
    try {
      await sql`
        DELETE FROM doctor_profiles
        WHERE user_id = ${userId}
      `;
      
      logger.debug('Doctor profile deleted from database', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete doctor profile', error, { userId });
      throw error;
    }
  }
}

module.exports = new DoctorRepository();
