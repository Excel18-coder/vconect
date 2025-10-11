const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const tutorController = require('../controllers/tutorController');

// Tutor profile routes
router.post('/profile', authenticateToken, tutorController.createTutorProfile);
router.get('/profile', authenticateToken, tutorController.getTutorProfile);
router.get('/profile/:id', tutorController.getPublicTutorProfile);
router.post('/profile/certificates', authenticateToken, tutorController.uploadCertificates);

// Session management
router.post('/sessions', authenticateToken, tutorController.createSession);
router.get('/sessions/:id', tutorController.getSession);
router.get('/sessions', authenticateToken, tutorController.getUserSessions);
router.get('/sessions/browse', tutorController.browseSessions);
router.put('/sessions/:id', authenticateToken, tutorController.updateSession);
router.delete('/sessions/:id', authenticateToken, tutorController.deleteSession);

// Booking management
router.post('/bookings', authenticateToken, tutorController.bookSession);
router.get('/bookings/session/:id', authenticateToken, tutorController.getSessionBookings);
router.get('/bookings', authenticateToken, tutorController.getUserBookings);
router.patch('/bookings/:id/status', authenticateToken, tutorController.updateBookingStatus);
router.delete('/bookings/:id', authenticateToken, tutorController.cancelBooking);
router.get('/bookings/:id', authenticateToken, tutorController.getBookingDetails);

module.exports = router;
