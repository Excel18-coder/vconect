/**
 * Matatu Tracking Controller
 * Handles real-time location tracking for matatus
 */

const { sql } = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * GET /api/transport/tracking/:scheduleId
 * Get current location of a matatu schedule
 */
exports.getMatutuLocation = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // Get the latest location for this schedule
    const location = await sql`
      SELECT 
        id, schedule_id, latitude, longitude, 
        speed, direction, timestamp, vehicle_id
      FROM matatu_locations
      WHERE schedule_id = ${scheduleId}
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    if (location.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Live tracking not available yet',
      });
    }

    return res.status(200).json({
      success: true,
      location: {
        latitude: parseFloat(location[0].latitude),
        longitude: parseFloat(location[0].longitude),
        speed: location[0].speed ? parseFloat(location[0].speed) : null,
        direction: location[0].direction ? parseInt(location[0].direction) : null,
        timestamp: location[0].timestamp,
      },
    });
  } catch (error) {
    logger.error('Get matatu location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch location',
    });
  }
};

/**
 * POST /api/transport/tracking
 * Update matatu location (called by driver app/GPS tracker)
 */
exports.updateLocation = async (req, res) => {
  try {
    const { schedule_id, latitude, longitude, speed, direction, vehicle_id } = req.body;

    if (!schedule_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: schedule_id, latitude, longitude',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const spd = speed !== undefined ? parseFloat(speed) : null;
    const dir = direction !== undefined ? parseInt(direction) : null;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude',
      });
    }

    // Verify schedule exists and is active
    const schedule = await sql`
      SELECT id FROM matatu_schedules WHERE id = ${schedule_id} AND status = 'active'
    `;

    if (schedule.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active schedule not found for this update',
      });
    }

    // Insert location record
    const result = await sql`
      INSERT INTO matatu_locations (
        schedule_id, vehicle_id, latitude, longitude, 
        speed, direction, timestamp
      ) VALUES (
        ${schedule_id}, ${vehicle_id || null}, 
        ${lat}, ${lng},
        ${Number.isNaN(spd) ? null : spd}, ${Number.isNaN(dir) ? null : dir}, NOW()
      )
      RETURNING *
    `;

    logger.info(`Location update: ${schedule_id} at (${latitude}, ${longitude})`);

    return res.status(201).json({
      success: true,
      location: result[0],
    });
  } catch (error) {
    logger.error('Update location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update location',
    });
  }
};

/**
 * GET /api/transport/tracking/history/:scheduleId
 * Get location history for a completed journey
 */
exports.getLocationHistory = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { limit = 50 } = req.query;

    const history = await sql`
      SELECT 
        id, latitude, longitude, speed, direction, timestamp
      FROM matatu_locations
      WHERE schedule_id = ${scheduleId}
      ORDER BY timestamp ASC
      LIMIT ${parseInt(limit)}
    `;

    return res.status(200).json({
      success: true,
      history: history.map((h) => ({
        latitude: parseFloat(h.latitude),
        longitude: parseFloat(h.longitude),
        speed: h.speed ? parseFloat(h.speed) : null,
        direction: h.direction ? parseInt(h.direction) : null,
        timestamp: h.timestamp,
      })),
      count: history.length,
    });
  } catch (error) {
    logger.error('Get location history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch location history',
    });
  }
};

/**
 * GET /api/transport/tracking/stats/:scheduleId
 * Get journey statistics
 */
exports.getJourneyStats = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // Get first and last locations
    const locations = await sql`
      SELECT 
        latitude, longitude, timestamp
      FROM matatu_locations
      WHERE schedule_id = ${scheduleId}
      ORDER BY timestamp ASC
    `;

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tracking data found',
      });
    }

    const firstLoc = locations[0];
    const lastLoc = locations[locations.length - 1];

    // Calculate distance (simple Haversine)
    const distance = calculateDistance(
      firstLoc.latitude,
      firstLoc.longitude,
      lastLoc.latitude,
      lastLoc.longitude
    );

    const startTime = new Date(firstLoc.timestamp);
    const endTime = new Date(lastLoc.timestamp);
    const durationMinutes = (endTime - startTime) / (1000 * 60);

    const avgSpeed = durationMinutes > 0 ? (distance / durationMinutes) * 60 : 0; // km/h

    return res.status(200).json({
      success: true,
      stats: {
        distance_km: parseFloat(distance.toFixed(2)),
        duration_minutes: parseInt(durationMinutes),
        average_speed_kmh: parseFloat(avgSpeed.toFixed(2)),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        tracking_points: locations.length,
      },
    });
  } catch (error) {
    logger.error('Get journey stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch journey statistics',
    });
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}
