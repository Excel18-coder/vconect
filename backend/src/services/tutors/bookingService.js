/**
 * Booking Service
 * Business logic for tutoring session bookings
 */

const bookingRepository = require('../../repositories/bookingRepository');
const sessionRepository = require('../../repositories/sessionRepository');
const notificationService = require('../buyers/notificationService');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, AuthorizationError, ConflictError } = require('../../errors');

class BookingService {
  /**
   * Book a tutoring session
   */
  async bookSession(studentId, bookingData) {
    logger.debug('Booking tutoring session', { studentId });

    // Validate required fields
    if (!bookingData.session_id) {
      throw new ValidationError('Session ID is required');
    }
    if (!bookingData.booking_date) {
      throw new ValidationError('Booking date is required');
    }
    if (!bookingData.start_time) {
      throw new ValidationError('Start time is required');
    }
    if (!bookingData.end_time) {
      throw new ValidationError('End time is required');
    }

    try {
      // Get session details
      const session = await sessionRepository.findById(bookingData.session_id);
      if (!session) {
        throw new NotFoundError('Session', bookingData.session_id);
      }

      if (session.status !== 'active') {
        throw new ValidationError('This session is not available for booking');
      }

      // Check if student is trying to book their own session
      if (session.tutor_id === studentId) {
        throw new ValidationError('You cannot book your own tutoring session');
      }

      // Check if date is in the future
      const bookingDate = new Date(bookingData.booking_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        throw new ValidationError('Booking date must be in the future');
      }

      // Check if slot is available
      const conflicts = await bookingRepository.findConflicts(
        bookingData.session_id,
        bookingData.booking_date,
        bookingData.start_time,
        bookingData.end_time
      );

      if (conflicts.length >= session.max_students) {
        throw new ConflictError('This time slot is fully booked');
      }

      // Create booking
      const booking = await bookingRepository.create({
        session_id: bookingData.session_id,
        tutor_id: session.tutor_id,
        student_id: studentId,
        booking_date: bookingData.booking_date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        total_amount: session.price,
        notes: bookingData.notes || null,
        status: 'pending'
      });

      // Send notification to tutor
      await notificationService.createNotification(
        session.tutor_id,
        'booking',
        'New Booking Request',
        `You have a new booking request for your session "${session.title}"`,
        { bookingId: booking.id, sessionId: session.id }
      );

      logger.info('Session booked successfully', { bookingId: booking.id, studentId, sessionId: session.id });
      return booking;
    } catch (error) {
      logger.error('Failed to book session', error, { studentId });
      throw error;
    }
  }

  /**
   * Get tutor's bookings
   */
  async getTutorBookings(tutorId, filters = {}) {
    logger.debug('Getting tutor bookings', { tutorId });

    try {
      const bookings = await bookingRepository.findByTutorId(tutorId, filters);
      return bookings;
    } catch (error) {
      logger.error('Failed to get tutor bookings', error, { tutorId });
      throw error;
    }
  }

  /**
   * Get student's bookings
   */
  async getStudentBookings(studentId, filters = {}) {
    logger.debug('Getting student bookings', { studentId });

    try {
      const bookings = await bookingRepository.findByStudentId(studentId, filters);
      return bookings;
    } catch (error) {
      logger.error('Failed to get student bookings', error, { studentId });
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId, userId) {
    logger.debug('Getting booking', { bookingId, userId });

    try {
      const booking = await bookingRepository.findByIdWithDetails(bookingId);
      
      if (!booking) {
        throw new NotFoundError('Booking', bookingId);
      }

      // Verify authorization (tutor or student)
      if (booking.tutor_id !== userId && booking.student_id !== userId) {
        throw new AuthorizationError('You can only view your own bookings');
      }

      return booking;
    } catch (error) {
      logger.error('Failed to get booking', error, { bookingId, userId });
      throw error;
    }
  }

  /**
   * Update booking status (tutor only)
   */
  async updateBookingStatus(bookingId, tutorId, statusData) {
    logger.debug('Updating booking status', { bookingId, tutorId });

    try {
      // Get booking and verify ownership
      const booking = await bookingRepository.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking', bookingId);
      }

      if (booking.tutor_id !== tutorId) {
        throw new AuthorizationError('Only the tutor can update booking status');
      }

      // Validate status
      const validStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled'];
      if (!statusData.status || !validStatuses.includes(statusData.status)) {
        throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
      }

      // Update booking
      const updateData = {
        status: statusData.status,
        meeting_link: statusData.meeting_link || booking.meeting_link,
        tutor_notes: statusData.tutor_notes || booking.tutor_notes
      };

      const updated = await bookingRepository.update(bookingId, updateData);

      // Send notification to student
      let notificationMessage = '';
      switch (statusData.status) {
        case 'confirmed':
          notificationMessage = 'Your tutoring session booking has been confirmed';
          break;
        case 'cancelled':
          notificationMessage = 'Your tutoring session booking has been cancelled';
          break;
        case 'completed':
          notificationMessage = 'Your tutoring session has been completed';
          break;
        default:
          notificationMessage = `Your booking status has been updated to ${statusData.status}`;
      }

      await notificationService.createNotification(
        booking.student_id,
        'booking',
        'Booking Status Update',
        notificationMessage,
        { bookingId: booking.id }
      );

      logger.info('Booking status updated', { bookingId, tutorId, status: statusData.status });
      return updated;
    } catch (error) {
      logger.error('Failed to update booking status', error, { bookingId, tutorId });
      throw error;
    }
  }

  /**
   * Cancel booking (student or tutor)
   */
  async cancelBooking(bookingId, userId) {
    logger.debug('Cancelling booking', { bookingId, userId });

    try {
      const booking = await bookingRepository.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking', bookingId);
      }

      // Verify authorization
      if (booking.tutor_id !== userId && booking.student_id !== userId) {
        throw new AuthorizationError('You can only cancel your own bookings');
      }

      // Check if booking can be cancelled
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        throw new ValidationError(`Cannot cancel a ${booking.status} booking`);
      }

      // Update status
      const updated = await bookingRepository.update(bookingId, { status: 'cancelled' });

      // Send notification to the other party
      const notificationUserId = booking.tutor_id === userId ? booking.student_id : booking.tutor_id;
      const cancelledBy = booking.tutor_id === userId ? 'tutor' : 'student';

      await notificationService.createNotification(
        notificationUserId,
        'booking',
        'Booking Cancelled',
        `A tutoring session booking has been cancelled by the ${cancelledBy}`,
        { bookingId: booking.id }
      );

      logger.info('Booking cancelled', { bookingId, userId, cancelledBy });
      return updated;
    } catch (error) {
      logger.error('Failed to cancel booking', error, { bookingId, userId });
      throw error;
    }
  }
}

module.exports = new BookingService();
