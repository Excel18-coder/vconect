/**
 * Transport Routes
 * Handles all matatu booking and route management endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const routesController = require('../../controllers/transport/routes-controller');
const bookingsController = require('../../controllers/transport/bookings-controller');
const trackingController = require('../../controllers/transport/tracking-controller');

// ==================== ROUTES ====================
// Search available routes
router.get('/routes', routesController.searchRoutes);

// Get route details
router.get('/routes/:id', routesController.getRouteDetails);

// Get schedule details
router.get('/schedules/:scheduleId', routesController.getScheduleDetails);

// ==================== BOOKINGS ====================
// Create booking
router.post('/bookings', authenticateToken, bookingsController.createBooking);

// Get user bookings
router.get('/bookings', authenticateToken, bookingsController.getUserBookings);

// Get booking details
router.get('/bookings/:bookingId', authenticateToken, bookingsController.getBookingDetails);

// Update booking (cancel, etc)
router.put('/bookings/:bookingId', authenticateToken, bookingsController.updateBooking);

// Delete booking (admin)
router.delete('/bookings/:bookingId', authenticateToken, bookingsController.deleteBooking);

// ==================== TRACKING ====================
// Get current matatu location
router.get('/tracking/:scheduleId', authenticateToken, trackingController.getMatutuLocation);

// Update matatu location (driver app)
router.post('/tracking', trackingController.updateLocation);

// Get location history
router.get('/tracking/history/:scheduleId', authenticateToken, trackingController.getLocationHistory);

// Get journey statistics
router.get('/tracking/stats/:scheduleId', authenticateToken, trackingController.getJourneyStats);

module.exports = router;
