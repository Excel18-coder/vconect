const { tutorService, sessionService, bookingService } = require('../services/tutors');
const { uploadService } = require('../services');
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendNotFound 
} = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// ============= TUTOR PROFILE =============

const createTutorProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profileData = req.body;

  const profile = await tutorService.createOrUpdateProfile(userId, profileData);
  return sendSuccess(res, 'Tutor profile saved', { profile });
});

const getTutorProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await tutorService.getProfile(userId);
  return sendSuccess(res, 'Tutor profile retrieved', { profile });
});

const getPublicTutorProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await tutorService.getPublicProfile(id);
  return sendSuccess(res, 'Tutor profile retrieved', { profile });
});

const uploadCertificates = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.files || req.files.length === 0) {
    return sendError(res, 'No certificates provided', 400);
  }

  const uploadedFiles = await uploadService.uploadMultipleDocuments(req.files, 'certificates');
  const profile = await tutorService.addCertificates(userId, uploadedFiles);

  return sendSuccess(res, 'Certificates uploaded', { profile });
});

// ============= SESSIONS =============

const createSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const sessionData = req.body;

  const session = await sessionService.createSession(userId, sessionData);
  return sendCreated(res, 'Session created', { session });
});

const getSession = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await sessionService.getSessionById(id);
  return sendSuccess(res, 'Session retrieved', { session });
});

const getUserSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await sessionService.getUserSessions(userId, {
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return sendSuccess(res, 'Sessions retrieved', result);
});

const browseSessions = asyncHandler(async (req, res) => {
  const filters = req.query;

  const result = await sessionService.browseSessions(filters);
  return sendSuccess(res, 'Sessions retrieved', result);
});

const updateSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  const session = await sessionService.updateSession(id, userId, updateData);
  return sendSuccess(res, 'Session updated', { session });
});

const deleteSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await sessionService.deleteSession(id, userId);
  return sendSuccess(res, 'Session deleted');
});

// ============= BOOKINGS =============

const bookSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { session_id, preferred_date, notes } = req.body;

  const booking = await bookingService.createBooking(userId, {
    session_id,
    preferred_date,
    notes
  });

  return sendCreated(res, 'Session booked', { booking });
});

const getSessionBookings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status } = req.query;

  const bookings = await bookingService.getSessionBookings(id, userId, status);
  return sendSuccess(res, 'Bookings retrieved', { bookings });
});

const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const bookings = await bookingService.getUserBookings(userId, status);
  return sendSuccess(res, 'Bookings retrieved', { bookings });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status, tutor_notes } = req.body;

  const booking = await bookingService.updateBookingStatus(id, userId, {
    status,
    tutor_notes
  });

  return sendSuccess(res, 'Booking status updated', { booking });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await bookingService.cancelBooking(id, userId);
  return sendSuccess(res, 'Booking cancelled');
});

const getBookingDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const booking = await bookingService.getBookingDetails(id, userId);
  return sendSuccess(res, 'Booking details retrieved', { booking });
});

module.exports = {
  // Tutor Profile
  createTutorProfile,
  getTutorProfile,
  getPublicTutorProfile,
  uploadCertificates,
  
  // Sessions
  createSession,
  getSession,
  getUserSessions,
  browseSessions,
  updateSession,
  deleteSession,
  
  // Bookings
  bookSession,
  getSessionBookings,
  getUserBookings,
  updateBookingStatus,
  cancelBooking,
  getBookingDetails
};
