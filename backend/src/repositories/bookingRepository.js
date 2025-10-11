/**
 * Booking Repository
 * Handles all database operations for tutor bookings
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class BookingRepository {
  /**
   * Create booking
   */
  async create(bookingData) {
    try {
      const result = await sql`
        INSERT INTO tutor_bookings (
          session_id, tutor_id, student_id, booking_date,
          start_time, end_time, total_amount, notes, status
        )
        VALUES (
          ${bookingData.session_id}, ${bookingData.tutor_id}, ${bookingData.student_id}, 
          ${bookingData.booking_date}, ${bookingData.start_time}, ${bookingData.end_time},
          ${bookingData.total_amount}, ${bookingData.notes}, ${bookingData.status}
        )
        RETURNING *
      `;
      
      logger.debug('Booking created in database', { bookingId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create booking', error, bookingData);
      throw error;
    }
  }

  /**
   * Find booking by ID
   */
  async findById(bookingId) {
    try {
      const result = await sql`
        SELECT * FROM tutor_bookings
        WHERE id = ${bookingId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find booking', error, { bookingId });
      throw error;
    }
  }

  /**
   * Find booking by ID with full details
   */
  async findByIdWithDetails(bookingId) {
    try {
      const result = await sql`
        SELECT 
          tb.*,
          ts.title as session_title,
          ts.subject,
          ts.mode,
          ts.location,
          student_prof.display_name as student_name,
          student_prof.avatar_url as student_avatar,
          su.email as student_email,
          tutor_prof.display_name as tutor_name,
          tutor_prof.avatar_url as tutor_avatar,
          tu.email as tutor_email
        FROM tutor_bookings tb
        JOIN tutoring_sessions ts ON tb.session_id = ts.id
        JOIN users su ON tb.student_id = su.id
        JOIN profiles student_prof ON tb.student_id = student_prof.user_id
        JOIN users tu ON tb.tutor_id = tu.id
        JOIN profiles tutor_prof ON tb.tutor_id = tutor_prof.user_id
        WHERE tb.id = ${bookingId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find booking with details', error, { bookingId });
      throw error;
    }
  }

  /**
   * Find bookings by tutor
   */
  async findByTutorId(tutorId, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;

      let conditions = [sql`tb.tutor_id = ${tutorId}`];

      if (status && status !== 'all') {
        conditions.push(sql`tb.status = ${status}`);
      }

      const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

      const result = await sql`
        SELECT 
          tb.*,
          ts.title as session_title,
          prof.display_name as student_name,
          prof.avatar_url as student_avatar,
          u.email as student_email
        FROM tutor_bookings tb
        JOIN tutoring_sessions ts ON tb.session_id = ts.id
        JOIN users u ON tb.student_id = u.id
        JOIN profiles prof ON tb.student_id = prof.user_id
        ${whereClause}
        ORDER BY tb.booking_date DESC, tb.start_time DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find bookings by tutor', error, { tutorId });
      throw error;
    }
  }

  /**
   * Find bookings by student
   */
  async findByStudentId(studentId, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;

      let conditions = [sql`tb.student_id = ${studentId}`];

      if (status && status !== 'all') {
        conditions.push(sql`tb.status = ${status}`);
      }

      const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

      const result = await sql`
        SELECT 
          tb.*,
          ts.title as session_title,
          ts.subject,
          ts.mode,
          ts.location,
          prof.display_name as tutor_name,
          prof.avatar_url as tutor_avatar,
          u.email as tutor_email
        FROM tutor_bookings tb
        JOIN tutoring_sessions ts ON tb.session_id = ts.id
        JOIN users u ON tb.tutor_id = u.id
        JOIN profiles prof ON tb.tutor_id = prof.user_id
        ${whereClause}
        ORDER BY tb.booking_date DESC, tb.start_time DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find bookings by student', error, { studentId });
      throw error;
    }
  }

  /**
   * Find conflicting bookings
   */
  async findConflicts(sessionId, bookingDate, startTime, endTime, excludeBookingId = null) {
    try {
      let query = sql`
        SELECT * FROM tutor_bookings
        WHERE session_id = ${sessionId}
        AND booking_date = ${bookingDate}
        AND status NOT IN ('cancelled')
        AND (
          (start_time <= ${startTime} AND end_time > ${startTime})
          OR
          (start_time < ${endTime} AND end_time >= ${endTime})
          OR
          (start_time >= ${startTime} AND end_time <= ${endTime})
        )
      `;

      if (excludeBookingId) {
        query = sql`${query} AND id != ${excludeBookingId}`;
      }

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Failed to find booking conflicts', error, { sessionId, bookingDate });
      throw error;
    }
  }

  /**
   * Update booking
   */
  async update(bookingId, updateData) {
    try {
      const result = await sql`
        UPDATE tutor_bookings
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${bookingId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Booking', bookingId);
      }
      
      logger.debug('Booking updated in database', { bookingId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update booking', error, { bookingId });
      throw error;
    }
  }

  /**
   * Delete booking
   */
  async delete(bookingId) {
    try {
      await sql`
        DELETE FROM tutor_bookings
        WHERE id = ${bookingId}
      `;
      
      logger.debug('Booking deleted from database', { bookingId });
      return true;
    } catch (error) {
      logger.error('Failed to delete booking', error, { bookingId });
      throw error;
    }
  }
}

module.exports = new BookingRepository();
