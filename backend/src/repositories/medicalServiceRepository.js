/**
 * Medical Service Repository
 * Handles all database operations for medical services
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class MedicalServiceRepository {
  /**
   * Create medical service
   */
  async create(serviceData) {
    try {
      const result = await sql`
        INSERT INTO medical_services (
          doctor_id, service_name, description, duration_minutes,
          price, currency, service_type, mode, status
        )
        VALUES (
          ${serviceData.doctor_id}, ${serviceData.service_name}, ${serviceData.description}, 
          ${serviceData.duration_minutes}, ${serviceData.price}, ${serviceData.currency},
          ${serviceData.service_type}, ${serviceData.mode}, ${serviceData.status}
        )
        RETURNING *
      `;
      
      logger.debug('Medical service created in database', { serviceId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create medical service', error, serviceData);
      throw error;
    }
  }

  /**
   * Find service by ID
   */
  async findById(serviceId) {
    try {
      const result = await sql`
        SELECT * FROM medical_services
        WHERE id = ${serviceId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find medical service', error, { serviceId });
      throw error;
    }
  }

  /**
   * Find service by ID with doctor details
   */
  async findByIdWithDetails(serviceId) {
    try {
      const result = await sql`
        SELECT 
          ms.*,
          dp.specialization,
          dp.rating as doctor_rating,
          prof.display_name as doctor_name,
          prof.avatar_url as doctor_avatar,
          u.email as doctor_email
        FROM medical_services ms
        JOIN doctor_profiles dp ON ms.doctor_id = dp.user_id
        JOIN users u ON ms.doctor_id = u.id
        JOIN profiles prof ON ms.doctor_id = prof.user_id
        WHERE ms.id = ${serviceId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find medical service with details', error, { serviceId });
      throw error;
    }
  }

  /**
   * Find services by doctor ID
   */
  async findByDoctorId(doctorId, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;

      let query = sql`
        SELECT * FROM medical_services
        WHERE doctor_id = ${doctorId}
      `;

      if (status && status !== 'all') {
        query = sql`${query} AND status = ${status}`;
      }

      query = sql`
        ${query}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Failed to find services by doctor', error, { doctorId });
      throw error;
    }
  }

  /**
   * Search medical services
   */
  async search(filters) {
    try {
      let conditions = [sql`ms.status = 'active'`];
      
      if (filters.service_type) {
        conditions.push(sql`ms.service_type = ${filters.service_type}`);
      }
      if (filters.mode) {
        conditions.push(sql`ms.mode = ${filters.mode}`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT 
          ms.*,
          dp.specialization,
          dp.rating as doctor_rating,
          prof.display_name as doctor_name,
          prof.avatar_url as doctor_avatar
        FROM medical_services ms
        JOIN doctor_profiles dp ON ms.doctor_id = dp.user_id
        JOIN profiles prof ON ms.doctor_id = prof.user_id
        ${whereClause}
        ORDER BY ms.created_at DESC
        LIMIT ${filters.limit} OFFSET ${filters.offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to search medical services', error, filters);
      throw error;
    }
  }

  /**
   * Count search results
   */
  async countSearch(filters) {
    try {
      let conditions = [sql`status = 'active'`];
      
      if (filters.service_type) {
        conditions.push(sql`service_type = ${filters.service_type}`);
      }
      if (filters.mode) {
        conditions.push(sql`mode = ${filters.mode}`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT COUNT(*)::INTEGER as count
        FROM medical_services
        ${whereClause}
      `;
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Failed to count search results', error, filters);
      throw error;
    }
  }

  /**
   * Update medical service
   */
  async update(serviceId, updateData) {
    try {
      const result = await sql`
        UPDATE medical_services
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${serviceId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Medical service', serviceId);
      }
      
      logger.debug('Medical service updated in database', { serviceId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update medical service', error, { serviceId });
      throw error;
    }
  }

  /**
   * Delete medical service
   */
  async delete(serviceId) {
    try {
      await sql`
        DELETE FROM medical_services
        WHERE id = ${serviceId}
      `;
      
      logger.debug('Medical service deleted from database', { serviceId });
      return true;
    } catch (error) {
      logger.error('Failed to delete medical service', error, { serviceId });
      throw error;
    }
  }
}

module.exports = new MedicalServiceRepository();
