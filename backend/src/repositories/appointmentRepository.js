/**
 * Appointment Repository
 * Handles all database operations for medical appointments
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class AppointmentRepository {
  /**
   * Create appointment
   */
  async create(appointmentData) {
    try {
      const result = await sql`
        INSERT INTO medical_appointments (
          service_id, doctor_id, patient_id, appointment_date,
          appointment_time, duration_minutes, consultation_mode,
          reason, symptoms, total_amount, status
        )
        VALUES (
          ${appointmentData.service_id}, ${appointmentData.doctor_id}, ${appointmentData.patient_id}, 
          ${appointmentData.appointment_date}, ${appointmentData.appointment_time}, ${appointmentData.duration_minutes},
          ${appointmentData.consultation_mode}, ${appointmentData.reason}, ${appointmentData.symptoms},
          ${appointmentData.total_amount}, ${appointmentData.status}
        )
        RETURNING *
      `;
      
      logger.debug('Appointment created in database', { appointmentId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create appointment', error, appointmentData);
      throw error;
    }
  }

  /**
   * Find appointment by ID
   */
  async findById(appointmentId) {
    try {
      const result = await sql`
        SELECT * FROM medical_appointments
        WHERE id = ${appointmentId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find appointment', error, { appointmentId });
      throw error;
    }
  }

  /**
   * Find appointment by ID with full details
   */
  async findByIdWithDetails(appointmentId) {
    try {
      const result = await sql`
        SELECT 
          ma.*,
          ms.service_name,
          dp.specialization,
          dp.clinic_name,
          dp.clinic_address,
          patient_prof.display_name as patient_name,
          patient_prof.avatar_url as patient_avatar,
          pu.email as patient_email,
          doctor_prof.display_name as doctor_name,
          doctor_prof.avatar_url as doctor_avatar,
          du.email as doctor_email
        FROM medical_appointments ma
        LEFT JOIN medical_services ms ON ma.service_id = ms.id
        JOIN doctor_profiles dp ON ma.doctor_id = dp.user_id
        JOIN users pu ON ma.patient_id = pu.id
        JOIN profiles patient_prof ON ma.patient_id = patient_prof.user_id
        JOIN users du ON ma.doctor_id = du.id
        JOIN profiles doctor_prof ON ma.doctor_id = doctor_prof.user_id
        WHERE ma.id = ${appointmentId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find appointment with details', error, { appointmentId });
      throw error;
    }
  }

  /**
   * Find appointments by doctor
   */
  async findByDoctorId(doctorId, options = {}) {
    try {
      const { status, date, limit = 20, offset = 0 } = options;

      let conditions = [sql`ma.doctor_id = ${doctorId}`];

      if (status && status !== 'all') {
        conditions.push(sql`ma.status = ${status}`);
      }
      if (date) {
        conditions.push(sql`ma.appointment_date = ${date}`);
      }

      const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

      const result = await sql`
        SELECT 
          ma.*,
          ms.service_name,
          prof.display_name as patient_name,
          prof.avatar_url as patient_avatar,
          u.email as patient_email
        FROM medical_appointments ma
        LEFT JOIN medical_services ms ON ma.service_id = ms.id
        JOIN users u ON ma.patient_id = u.id
        JOIN profiles prof ON ma.patient_id = prof.user_id
        ${whereClause}
        ORDER BY ma.appointment_date DESC, ma.appointment_time DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find appointments by doctor', error, { doctorId });
      throw error;
    }
  }

  /**
   * Find appointments by patient
   */
  async findByPatientId(patientId, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;

      let conditions = [sql`ma.patient_id = ${patientId}`];

      if (status && status !== 'all') {
        conditions.push(sql`ma.status = ${status}`);
      }

      const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

      const result = await sql`
        SELECT 
          ma.*,
          ms.service_name,
          dp.specialization,
          dp.clinic_name,
          dp.clinic_address,
          prof.display_name as doctor_name,
          prof.avatar_url as doctor_avatar,
          u.email as doctor_email
        FROM medical_appointments ma
        LEFT JOIN medical_services ms ON ma.service_id = ms.id
        JOIN doctor_profiles dp ON ma.doctor_id = dp.user_id
        JOIN users u ON ma.doctor_id = u.id
        JOIN profiles prof ON ma.doctor_id = prof.user_id
        ${whereClause}
        ORDER BY ma.appointment_date DESC, ma.appointment_time DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find appointments by patient', error, { patientId });
      throw error;
    }
  }

  /**
   * Find conflicting appointments
   */
  async findConflicts(doctorId, appointmentDate, appointmentTime, excludeAppointmentId = null) {
    try {
      let query = sql`
        SELECT * FROM medical_appointments
        WHERE doctor_id = ${doctorId}
        AND appointment_date = ${appointmentDate}
        AND appointment_time = ${appointmentTime}
        AND status NOT IN ('cancelled', 'no-show')
      `;

      if (excludeAppointmentId) {
        query = sql`${query} AND id != ${excludeAppointmentId}`;
      }

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Failed to find appointment conflicts', error, { doctorId, appointmentDate });
      throw error;
    }
  }

  /**
   * Update appointment
   */
  async update(appointmentId, updateData) {
    try {
      const result = await sql`
        UPDATE medical_appointments
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${appointmentId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Appointment', appointmentId);
      }
      
      logger.debug('Appointment updated in database', { appointmentId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update appointment', error, { appointmentId });
      throw error;
    }
  }

  /**
   * Delete appointment
   */
  async delete(appointmentId) {
    try {
      await sql`
        DELETE FROM medical_appointments
        WHERE id = ${appointmentId}
      `;
      
      logger.debug('Appointment deleted from database', { appointmentId });
      return true;
    } catch (error) {
      logger.error('Failed to delete appointment', error, { appointmentId });
      throw error;
    }
  }
}

module.exports = new AppointmentRepository();
