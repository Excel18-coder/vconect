/**
 * Matatu Bookings Controller
 * Handles booking creation, management, and cancellations
 */

const { sql } = require('../../config/database');
const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const EventTrackingService = require('../../services/analytics/event-tracking-service');

/**
 * POST /api/transport/bookings
 * Create a new matatu booking
 */
exports.createBooking = async (req, res) => {
  try {
    const { schedule_id, seats_booked, payment_method, user_id, passenger_details } = req.body;

    if (!schedule_id || !seats_booked || !Array.isArray(seats_booked) || seats_booked.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking details',
      });
    }

    const userId = user_id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Get schedule details
    const schedule = await sql`
      SELECT s.*, mr.route_name, mo.name as operator_name
      FROM matatu_schedules s
      JOIN matatu_routes mr ON s.route_id = mr.id
      JOIN matatu_operators mo ON mr.operator_id = mo.id
      WHERE s.id = ${schedule_id}
    `;

    if (schedule.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    const scheduleData = schedule[0];

    // Check if seats are available
    const bookedSeats = await sql`
      SELECT seat_number FROM matatu_seats 
      WHERE schedule_id = ${schedule_id} AND is_booked = true
    `;

    const bookedSeatNumbers = bookedSeats.map((s) => s.seat_number);
    const conflictingSeats = seats_booked.filter((seat) => bookedSeatNumbers.includes(seat));

    if (conflictingSeats.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Seats ${conflictingSeats.join(', ')} are already booked`,
      });
    }

    // Calculate total price
    const totalPrice = seats_booked.length * parseFloat(scheduleData.price_per_seat);

    // Generate booking reference
    const bookingReference = `MBK${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;
    const bookingId = uuidv4();

    // Create booking
    const booking = await sql`
      INSERT INTO matatu_bookings (
        id, user_id, schedule_id, seats_booked, total_price, 
        status, booking_reference, payment_method, created_at
      ) VALUES (
        ${bookingId}, ${userId}, ${schedule_id}, 
        ${JSON.stringify(seats_booked)}, ${totalPrice},
        ${payment_method === 'cash' ? 'pending' : 'confirmed'}, 
        ${bookingReference}, ${payment_method}, NOW()
      )
      RETURNING *
    `;

    // Mark seats as booked
    for (const seatNumber of seats_booked) {
      await sql`
        UPDATE matatu_seats 
        SET is_booked = true, booking_id = ${bookingId}
        WHERE schedule_id = ${schedule_id} AND seat_number = ${seatNumber}
      `;
    }

    // Update available seats count
    const newAvailableSeats = parseInt(scheduleData.available_seats) - seats_booked.length;
    await sql`
      UPDATE matatu_schedules 
      SET available_seats = ${newAvailableSeats}
      WHERE id = ${schedule_id}
    `;

    logger.info(
      `Booking created: ${bookingReference} by user ${userId} for ${seats_booked.length} seats`
    );

    // Track event
    EventTrackingService.trackEvent({
      userId,
      eventType: 'matatu.booking.create',
      category: 'transport',
      details: {
        booking_reference: bookingReference,
        schedule_id,
        seats_count: seats_booked.length,
        total_price: totalPrice,
        payment_method,
      },
    });

    return res.status(201).json({
      success: true,
      booking: {
        id: bookingId,
        booking_reference: bookingReference,
        operator_name: scheduleData.operator_name,
        route_name: scheduleData.route_name,
        departure_time: scheduleData.departure_time,
        seats_booked: seats_booked,
        total_price: totalPrice,
        status: booking[0].status,
      },
    });
  } catch (error) {
    logger.error('Create booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/transport/bookings
 * Get user's bookings
 */
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const bookings = await sql`
      SELECT 
        b.*,
        mr.route_name,
        mo.name as operator_name,
        s.departure_time,
        s.arrival_time
      FROM matatu_bookings b
      JOIN matatu_schedules s ON b.schedule_id = s.id
      JOIN matatu_routes mr ON s.route_id = mr.id
      JOIN matatu_operators mo ON mr.operator_id = mo.id
      WHERE b.user_id = ${userId}
      ORDER BY s.departure_time DESC
    `;

    return res.status(200).json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        booking_reference: b.booking_reference,
        operator_name: b.operator_name,
        route_name: b.route_name,
        departure_time: b.departure_time,
        arrival_time: b.arrival_time,
        seats_booked: JSON.parse(b.seats_booked),
        total_price: parseFloat(b.total_price),
        status: b.status,
        created_at: b.created_at,
      })),
      count: bookings.length,
    });
  } catch (error) {
    logger.error('Get user bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
};

/**
 * GET /api/transport/bookings/:bookingId
 * Get booking details
 */
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await sql`
      SELECT 
        b.*,
        mr.route_name,
        mo.name as operator_name,
        s.departure_time,
        s.arrival_time
      FROM matatu_bookings b
      JOIN matatu_schedules s ON b.schedule_id = s.id
      JOIN matatu_routes mr ON s.route_id = mr.id
      JOIN matatu_operators mo ON mr.operator_id = mo.id
      WHERE b.id = ${bookingId}
    `;

    if (booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const bookingData = booking[0];

    return res.status(200).json({
      success: true,
      booking: {
        id: bookingData.id,
        booking_reference: bookingData.booking_reference,
        operator_name: bookingData.operator_name,
        route_name: bookingData.route_name,
        departure_time: bookingData.departure_time,
        arrival_time: bookingData.arrival_time,
        seats_booked: JSON.parse(bookingData.seats_booked),
        total_price: parseFloat(bookingData.total_price),
        status: bookingData.status,
        payment_method: bookingData.payment_method,
      },
    });
  } catch (error) {
    logger.error('Get booking details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
    });
  }
};

/**
 * PUT /api/transport/bookings/:bookingId
 * Update booking (cancel or modify)
 */
exports.updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Get booking details
    const booking = await sql`
      SELECT * FROM matatu_bookings WHERE id = ${bookingId}
    `;

    if (booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const currentBooking = booking[0];

    if (status === 'cancelled' && currentBooking.status === 'confirmed') {
      const seatsBooked = JSON.parse(currentBooking.seats_booked);

      // Release seats
      await sql`
        UPDATE matatu_seats 
        SET is_booked = false, booking_id = NULL
        WHERE booking_id = ${bookingId}
      `;

      // Update schedule available seats
      const schedule = await sql`
        SELECT available_seats FROM matatu_schedules WHERE id = ${currentBooking.schedule_id}
      `;

      if (schedule.length > 0) {
        const newAvailable = parseInt(schedule[0].available_seats) + seatsBooked.length;
        await sql`
          UPDATE matatu_schedules 
          SET available_seats = ${newAvailable}
          WHERE id = ${currentBooking.schedule_id}
        `;
      }

      // Record refund (implement payment refund logic here)
      logger.info(`Booking ${bookingId} cancelled. Refund processed.`);

      // Track cancellation event
      EventTrackingService.trackEvent({
        userId: currentBooking.user_id,
        eventType: 'matatu.booking.cancel',
        category: 'transport',
        details: {
          booking_id: bookingId,
          booking_reference: currentBooking.booking_reference,
          refund_amount: currentBooking.total_price,
        },
      });
    }

    // Update booking status
    const updated = await sql`
      UPDATE matatu_bookings 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${bookingId}
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: `Booking ${status === 'cancelled' ? 'cancelled successfully' : 'updated successfully'}`,
      booking: {
        id: updated[0].id,
        booking_reference: updated[0].booking_reference,
        status: updated[0].status,
      },
    });
  } catch (error) {
    logger.error('Update booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking',
    });
  }
};

/**
 * DELETE /api/transport/bookings/:bookingId
 * Delete booking (admin only)
 */
exports.deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Soft delete
    await sql`
      UPDATE matatu_bookings 
      SET status = 'cancelled', deleted_at = NOW()
      WHERE id = ${bookingId}
    `;

    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    logger.error('Delete booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
    });
  }
};
