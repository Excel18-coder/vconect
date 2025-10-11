/**
 * Appointment Service
 * Business logic for medical appointments management
 */

const appointmentRepository = require('../../repositories/appointmentRepository');
const medicalServiceRepository = require('../../repositories/medicalServiceRepository');
const doctorRepository = require('../../repositories/doctorRepository');
const notificationService = require('../buyers/notificationService');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, AuthorizationError, ConflictError } = require('../../errors');

class AppointmentService {
  /**
   * Book appointment
   */
  async bookAppointment(patientId, appointmentData) {
    logger.debug('Booking medical appointment', { patientId });

    // Validate required fields
    if (!appointmentData.doctor_id) {
      throw new ValidationError('Doctor ID is required');
    }
    if (!appointmentData.appointment_date) {
      throw new ValidationError('Appointment date is required');
    }
    if (!appointmentData.appointment_time) {
      throw new ValidationError('Appointment time is required');
    }
    if (!appointmentData.consultation_mode) {
      throw new ValidationError('Consultation mode is required');
    }

    try {
      // Validate doctor exists
      const doctor = await doctorRepository.findByUserId(appointmentData.doctor_id);
      if (!doctor) {
        throw new NotFoundError('Doctor', appointmentData.doctor_id);
      }

      // Check if patient is trying to book with themselves
      if (appointmentData.doctor_id === patientId) {
        throw new ValidationError('You cannot book an appointment with yourself');
      }

      // Get total amount
      let totalAmount = 0;
      if (appointmentData.service_id) {
        const service = await medicalServiceRepository.findById(appointmentData.service_id);
        if (!service) {
          throw new NotFoundError('Medical service', appointmentData.service_id);
        }
        totalAmount = service.price;
      } else {
        totalAmount = doctor.consultation_fee || 0;
      }

      // Check if date is in the future
      const appointmentDate = new Date(appointmentData.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        throw new ValidationError('Appointment date must be in the future');
      }

      // Check for conflicts
      const conflicts = await appointmentRepository.findConflicts(
        appointmentData.doctor_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time
      );

      if (conflicts.length > 0) {
        throw new ConflictError('This time slot is not available');
      }

      // Create appointment
      const appointment = await appointmentRepository.create({
        service_id: appointmentData.service_id || null,
        doctor_id: appointmentData.doctor_id,
        patient_id: patientId,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        duration_minutes: appointmentData.duration_minutes || 30,
        consultation_mode: appointmentData.consultation_mode,
        reason: appointmentData.reason || null,
        symptoms: appointmentData.symptoms || null,
        total_amount: totalAmount,
        status: 'pending'
      });

      // Send notification to doctor
      await notificationService.createNotification(
        appointmentData.doctor_id,
        'appointment',
        'New Appointment Request',
        `You have a new appointment request from a patient`,
        { appointmentId: appointment.id }
      );

      logger.info('Appointment booked successfully', { appointmentId: appointment.id, patientId });
      return appointment;
    } catch (error) {
      logger.error('Failed to book appointment', error, { patientId });
      throw error;
    }
  }

  /**
   * Get doctor's appointments
   */
  async getDoctorAppointments(doctorId, filters = {}) {
    logger.debug('Getting doctor appointments', { doctorId });

    try {
      const appointments = await appointmentRepository.findByDoctorId(doctorId, filters);
      return appointments;
    } catch (error) {
      logger.error('Failed to get doctor appointments', error, { doctorId });
      throw error;
    }
  }

  /**
   * Get patient's appointments
   */
  async getPatientAppointments(patientId, filters = {}) {
    logger.debug('Getting patient appointments', { patientId });

    try {
      const appointments = await appointmentRepository.findByPatientId(patientId, filters);
      return appointments;
    } catch (error) {
      logger.error('Failed to get patient appointments', error, { patientId });
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(appointmentId, userId) {
    logger.debug('Getting appointment', { appointmentId, userId });

    try {
      const appointment = await appointmentRepository.findByIdWithDetails(appointmentId);
      
      if (!appointment) {
        throw new NotFoundError('Appointment', appointmentId);
      }

      // Verify authorization (doctor or patient)
      if (appointment.doctor_id !== userId && appointment.patient_id !== userId) {
        throw new AuthorizationError('You can only view your own appointments');
      }

      return appointment;
    } catch (error) {
      logger.error('Failed to get appointment', error, { appointmentId, userId });
      throw error;
    }
  }

  /**
   * Update appointment status (doctor only)
   */
  async updateAppointmentStatus(appointmentId, doctorId, statusData) {
    logger.debug('Updating appointment status', { appointmentId, doctorId });

    try {
      // Get appointment and verify ownership
      const appointment = await appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment', appointmentId);
      }

      if (appointment.doctor_id !== doctorId) {
        throw new AuthorizationError('Only the doctor can update appointment status');
      }

      // Validate status
      const validStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
      if (!statusData.status || !validStatuses.includes(statusData.status)) {
        throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
      }

      // Update appointment
      const updateData = {
        status: statusData.status,
        meeting_link: statusData.meeting_link || appointment.meeting_link,
        prescription: statusData.prescription || appointment.prescription,
        diagnosis: statusData.diagnosis || appointment.diagnosis,
        notes: statusData.notes || appointment.notes,
        follow_up_required: statusData.follow_up_required !== undefined 
          ? statusData.follow_up_required 
          : appointment.follow_up_required,
        follow_up_date: statusData.follow_up_date || appointment.follow_up_date
      };

      const updated = await appointmentRepository.update(appointmentId, updateData);

      // If completed, increment doctor's counts
      if (statusData.status === 'completed') {
        await doctorRepository.incrementConsultationCount(doctorId);
        await doctorRepository.incrementPatientCount(doctorId);
      }

      // Send notification to patient
      let notificationMessage = '';
      switch (statusData.status) {
        case 'confirmed':
          notificationMessage = 'Your appointment has been confirmed';
          break;
        case 'cancelled':
          notificationMessage = 'Your appointment has been cancelled';
          break;
        case 'completed':
          notificationMessage = 'Your appointment has been completed';
          break;
        default:
          notificationMessage = `Your appointment status has been updated to ${statusData.status}`;
      }

      await notificationService.createNotification(
        appointment.patient_id,
        'appointment',
        'Appointment Status Update',
        notificationMessage,
        { appointmentId: appointment.id }
      );

      logger.info('Appointment status updated', { appointmentId, doctorId, status: statusData.status });
      return updated;
    } catch (error) {
      logger.error('Failed to update appointment status', error, { appointmentId, doctorId });
      throw error;
    }
  }

  /**
   * Cancel appointment (patient or doctor)
   */
  async cancelAppointment(appointmentId, userId) {
    logger.debug('Cancelling appointment', { appointmentId, userId });

    try {
      const appointment = await appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment', appointmentId);
      }

      // Verify authorization
      if (appointment.doctor_id !== userId && appointment.patient_id !== userId) {
        throw new AuthorizationError('You can only cancel your own appointments');
      }

      // Check if appointment can be cancelled
      if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        throw new ValidationError(`Cannot cancel a ${appointment.status} appointment`);
      }

      // Update status
      const updated = await appointmentRepository.update(appointmentId, { status: 'cancelled' });

      // Send notification to the other party
      const notificationUserId = appointment.doctor_id === userId ? appointment.patient_id : appointment.doctor_id;
      const cancelledBy = appointment.doctor_id === userId ? 'doctor' : 'patient';

      await notificationService.createNotification(
        notificationUserId,
        'appointment',
        'Appointment Cancelled',
        `An appointment has been cancelled by the ${cancelledBy}`,
        { appointmentId: appointment.id }
      );

      logger.info('Appointment cancelled', { appointmentId, userId, cancelledBy });
      return updated;
    } catch (error) {
      logger.error('Failed to cancel appointment', error, { appointmentId, userId });
      throw error;
    }
  }
}

module.exports = new AppointmentService();
