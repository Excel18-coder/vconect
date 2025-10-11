/**
 * Session Repository
 * Handles all database operations for tutoring sessions
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class SessionRepository {
  /**
   * Create session
   */
  async create(sessionData) {
    try {
      const result = await sql`
        INSERT INTO tutoring_sessions (
          tutor_id, title, description, subject, level, session_type,
          duration_minutes, price, currency, max_students, mode, location,
          materials_included, prerequisites, tags, images, status
        )
        VALUES (
          ${sessionData.tutor_id}, ${sessionData.title}, ${sessionData.description}, 
          ${sessionData.subject}, ${sessionData.level}, ${sessionData.session_type},
          ${sessionData.duration_minutes}, ${sessionData.price}, ${sessionData.currency}, 
          ${sessionData.max_students}, ${sessionData.mode}, ${sessionData.location},
          ${sessionData.materials_included}, ${sessionData.prerequisites}, ${sessionData.tags}, 
          ${sessionData.images}, ${sessionData.status}
        )
        RETURNING *
      `;
      
      logger.debug('Tutoring session created in database', { sessionId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create session', error, sessionData);
      throw error;
    }
  }

  /**
   * Find session by ID
   */
  async findById(sessionId) {
    try {
      const result = await sql`
        SELECT * FROM tutoring_sessions
        WHERE id = ${sessionId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find session', error, { sessionId });
      throw error;
    }
  }

  /**
   * Find session by ID with tutor details
   */
  async findByIdWithDetails(sessionId) {
    try {
      const result = await sql`
        SELECT 
          ts.*,
          prof.display_name as tutor_name,
          prof.avatar_url as tutor_avatar,
          tp.rating as tutor_rating,
          tp.total_students as tutor_students,
          u.email as tutor_email
        FROM tutoring_sessions ts
        JOIN users u ON ts.tutor_id = u.id
        JOIN profiles prof ON ts.tutor_id = prof.user_id
        LEFT JOIN tutor_profiles tp ON ts.tutor_id = tp.user_id
        WHERE ts.id = ${sessionId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find session with details', error, { sessionId });
      throw error;
    }
  }

  /**
   * Find sessions by tutor ID
   */
  async findByTutorId(tutorId, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;

      let query = sql`
        SELECT * FROM tutoring_sessions
        WHERE tutor_id = ${tutorId}
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
      logger.error('Failed to find sessions by tutor', error, { tutorId });
      throw error;
    }
  }

  /**
   * Search sessions
   */
  async search(filters) {
    try {
      let conditions = [sql`ts.status = 'active'`];
      
      if (filters.subject) {
        conditions.push(sql`ts.subject ILIKE ${'%' + filters.subject + '%'}`);
      }
      if (filters.level) {
        conditions.push(sql`ts.level = ${filters.level}`);
      }
      if (filters.mode) {
        conditions.push(sql`ts.mode = ${filters.mode}`);
      }
      if (filters.min_price !== undefined && filters.min_price !== null) {
        conditions.push(sql`ts.price >= ${filters.min_price}`);
      }
      if (filters.max_price !== undefined && filters.max_price !== null) {
        conditions.push(sql`ts.price <= ${filters.max_price}`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT 
          ts.*,
          prof.display_name as tutor_name,
          prof.avatar_url as tutor_avatar,
          tp.rating as tutor_rating,
          tp.total_students as tutor_students
        FROM tutoring_sessions ts
        JOIN users u ON ts.tutor_id = u.id
        JOIN profiles prof ON ts.tutor_id = prof.user_id
        LEFT JOIN tutor_profiles tp ON ts.tutor_id = tp.user_id
        ${whereClause}
        ORDER BY ts.created_at DESC
        LIMIT ${filters.limit} OFFSET ${filters.offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to search sessions', error, filters);
      throw error;
    }
  }

  /**
   * Count search results
   */
  async countSearch(filters) {
    try {
      let conditions = [sql`status = 'active'`];
      
      if (filters.subject) {
        conditions.push(sql`subject ILIKE ${'%' + filters.subject + '%'}`);
      }
      if (filters.level) {
        conditions.push(sql`level = ${filters.level}`);
      }
      if (filters.mode) {
        conditions.push(sql`mode = ${filters.mode}`);
      }
      if (filters.min_price !== undefined && filters.min_price !== null) {
        conditions.push(sql`price >= ${filters.min_price}`);
      }
      if (filters.max_price !== undefined && filters.max_price !== null) {
        conditions.push(sql`price <= ${filters.max_price}`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT COUNT(*)::INTEGER as count
        FROM tutoring_sessions
        ${whereClause}
      `;
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Failed to count search results', error, filters);
      throw error;
    }
  }

  /**
   * Update session
   */
  async update(sessionId, updateData) {
    try {
      const result = await sql`
        UPDATE tutoring_sessions
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${sessionId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Session', sessionId);
      }
      
      logger.debug('Session updated in database', { sessionId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update session', error, { sessionId });
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getStatistics(sessionId) {
    try {
      const result = await sql`
        SELECT 
          COUNT(DISTINCT tb.id)::INTEGER as total_bookings,
          COUNT(DISTINCT CASE WHEN tb.status = 'pending' THEN tb.id END)::INTEGER as pending_bookings,
          COUNT(DISTINCT CASE WHEN tb.status = 'confirmed' THEN tb.id END)::INTEGER as confirmed_bookings,
          COUNT(DISTINCT CASE WHEN tb.status = 'completed' THEN tb.id END)::INTEGER as completed_bookings,
          COUNT(DISTINCT CASE WHEN tb.status = 'cancelled' THEN tb.id END)::INTEGER as cancelled_bookings,
          COUNT(DISTINCT tb.student_id)::INTEGER as unique_students
        FROM tutoring_sessions ts
        LEFT JOIN tutor_bookings tb ON ts.id = tb.session_id
        WHERE ts.id = ${sessionId}
        GROUP BY ts.id
      `;
      
      return result[0] || {
        total_bookings: 0,
        pending_bookings: 0,
        confirmed_bookings: 0,
        completed_bookings: 0,
        cancelled_bookings: 0,
        unique_students: 0
      };
    } catch (error) {
      logger.error('Failed to get session statistics', error, { sessionId });
      throw error;
    }
  }

  /**
   * Delete session
   */
  async delete(sessionId) {
    try {
      await sql`
        DELETE FROM tutoring_sessions
        WHERE id = ${sessionId}
      `;
      
      logger.debug('Session deleted from database', { sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to delete session', error, { sessionId });
      throw error;
    }
  }
}

module.exports = new SessionRepository();
