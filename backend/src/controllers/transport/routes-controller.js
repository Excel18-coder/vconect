/**
 * Matatu Routes Controller
 * Handles matatu route searches and schedule retrieval
 */

const { sql } = require('../../config/database');
const logger = require('../../utils/logger');
const { eventTrackingService } = require('../../services/analytics/event-tracking-service');

/**
 * GET /api/transport/routes
 * Search for available matatu routes
 */
exports.searchRoutes = async (req, res) => {
  try {
    const { from, to, date, passengers } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: from, to, date',
      });
    }

    // Search for schedules matching criteria
    const schedules = await sql`
      SELECT 
        s.id,
        mo.name as operator_name,
        mr.route_name,
        s.departure_time,
        s.arrival_time,
        s.available_seats,
        s.price_per_seat,
        mr.distance,
        mo.rating,
        mo.review_count as reviews
      FROM matatu_schedules s
      JOIN matatu_routes mr ON s.route_id = mr.id
      JOIN matatu_operators mo ON mr.operator_id = mo.id
      WHERE LOWER(mr.from_location) LIKE LOWER(${`%${from}%`})
        AND LOWER(mr.to_location) LIKE LOWER(${`%${to}%`})
        AND DATE(s.departure_time) = ${date}
        AND s.available_seats >= ${passengers}
        AND s.status = 'active'
        AND mo.verified = true
      ORDER BY s.departure_time ASC
    `;

    logger.info(`Route search: ${from} → ${to} on ${date}, found ${schedules.length} matches`);

    // Track search event
    eventTrackingService.trackEvent({
      userId: req.user?.id,
      eventType: 'matatu.search',
      category: 'transport',
      details: {
        from_location: from,
        to_location: to,
        date,
        passengers,
        results_count: schedules.length,
      },
    });

    return res.status(200).json({
      success: true,
      schedules: schedules.map((s) => ({
        id: s.id,
        operator_name: s.operator_name,
        route_name: s.route_name,
        departure_time: s.departure_time,
        arrival_time: s.arrival_time,
        available_seats: parseInt(s.available_seats),
        price_per_seat: parseFloat(s.price_per_seat),
        distance: parseInt(s.distance),
        rating: parseFloat(s.rating || 0),
        reviews: parseInt(s.reviews || 0),
      })),
      count: schedules.length,
    });
  } catch (error) {
    logger.error('Route search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search routes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/transport/routes/:id
 * Get detailed information about a specific route
 */
exports.getRouteDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const route = await sql`
      SELECT 
        mr.*,
        mo.name as operator_name,
        mo.phone as operator_phone,
        mo.email as operator_email,
        mo.license_number
      FROM matatu_routes mr
      JOIN matatu_operators mo ON mr.operator_id = mo.id
      WHERE mr.id = ${id}
    `;

    if (route.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }

    return res.status(200).json({
      success: true,
      route: route[0],
    });
  } catch (error) {
    logger.error('Get route details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch route details',
    });
  }
};

/**
 * GET /api/transport/schedules/:scheduleId
 * Get schedule details including available seats
 */
exports.getScheduleDetails = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await sql`
      SELECT 
        s.*,
        mr.route_name,
        mr.distance,
        mo.name as operator_name
      FROM matatu_schedules s
      JOIN matatu_routes mr ON s.route_id = mr.id
      JOIN matatu_operators mo ON mr.operator_id = mo.id
      WHERE s.id = ${scheduleId}
    `;

    if (schedule.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Get booked seats for this schedule
    const bookedSeats = await sql`
      SELECT seat_number 
      FROM matatu_seats 
      WHERE schedule_id = ${scheduleId} AND is_booked = true
    `;

    return res.status(200).json({
      success: true,
      schedule: schedule[0],
      booked_seats: bookedSeats.map((s) => s.seat_number),
    });
  } catch (error) {
    logger.error('Get schedule details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule details',
    });
  }
};
