/**
 * Transport Integration Controller
 * Handles bulk import of operators, routes, and schedules from external systems
 */

const { sql } = require('../../config/database');
const logger = require('../../utils/logger');

const normalizeString = (value) => String(value || '').trim();

exports.importSchedules = async (req, res) => {
  try {
    const { operator, routes = [] } = req.body;

    if (!operator?.name || !operator?.license_number) {
      return res.status(400).json({
        success: false,
        message: 'Operator name and license_number are required',
      });
    }

    if (!Array.isArray(routes) || routes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one route with schedules is required',
      });
    }

    await sql`BEGIN`;

    // Upsert operator by license_number
    const operatorResult = await sql`
      INSERT INTO matatu_operators (name, email, phone, license_number, verified, rating, review_count, description)
      VALUES (
        ${normalizeString(operator.name)},
        ${normalizeString(operator.email)},
        ${normalizeString(operator.phone)},
        ${normalizeString(operator.license_number)},
        true,
        ${operator.rating || 0},
        ${operator.review_count || 0},
        ${normalizeString(operator.description)}
      )
      ON CONFLICT (license_number)
      DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        description = EXCLUDED.description
      RETURNING id
    `;

    const operatorId = operatorResult[0].id;

    let schedulesImported = 0;

    for (const route of routes) {
      if (!route?.route_name || !route?.from_location || !route?.to_location) {
        await sql`ROLLBACK`;
        return res.status(400).json({
          success: false,
          message: 'Each route requires route_name, from_location, and to_location',
        });
      }

      const routeResult = await sql`
        INSERT INTO matatu_routes (
          operator_id, route_name, from_location, to_location, distance, estimated_time, is_active
        ) VALUES (
          ${operatorId},
          ${normalizeString(route.route_name)},
          ${normalizeString(route.from_location)},
          ${normalizeString(route.to_location)},
          ${route.distance || null},
          ${normalizeString(route.estimated_time) || null},
          true
        )
        RETURNING id
      `;

      const routeId = routeResult[0].id;
      const schedules = Array.isArray(route.schedules) ? route.schedules : [];

      for (const schedule of schedules) {
        if (!schedule?.departure_time || !schedule?.arrival_time || !schedule?.price_per_seat) {
          await sql`ROLLBACK`;
          return res.status(400).json({
            success: false,
            message: 'Each schedule requires departure_time, arrival_time, and price_per_seat',
          });
        }

        await sql`
          INSERT INTO matatu_schedules (
            route_id, departure_time, arrival_time, total_seats, available_seats, price_per_seat, status, date
          ) VALUES (
            ${routeId},
            ${schedule.departure_time},
            ${schedule.arrival_time},
            ${schedule.total_seats || 48},
            ${schedule.available_seats || schedule.total_seats || 48},
            ${schedule.price_per_seat},
            ${schedule.status || 'active'},
            ${schedule.date || null}
          )
        `;

        schedulesImported += 1;
      }
    }

    await sql`COMMIT`;

    logger.info('Transport schedules imported', { operatorId, schedulesImported });

    return res.status(201).json({
      success: true,
      operator_id: operatorId,
      schedules_imported: schedulesImported,
    });
  } catch (error) {
    try {
      await sql`ROLLBACK`;
    } catch (rollbackError) {
      logger.error('Transport import rollback error:', rollbackError);
    }

    logger.error('Transport import error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import transport schedules',
    });
  }
};