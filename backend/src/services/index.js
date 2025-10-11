/**
 * Services Index
 * Main barrel export for all services
 */

// User services
const { authService, tokenService, profileService } = require('./users');

// Buyer services
const { wishlistService, notificationService, messageService, reviewService } = require('./buyers');

// Product services
const { productService, imageService } = require('./products');

// Landlord services
const { landlordService, propertyService, viewingService } = require('./landlords');

// Tutor services
const { tutorService, sessionService, bookingService } = require('./tutors');

// Doctor services
const { doctorService, medicalServiceService, appointmentService } = require('./doctors');

// Employer services
const { employerService, jobService, applicationService } = require('./employers');

// Upload service
const uploadService = require('./upload/uploadService');

module.exports = {
  // User services
  authService,
  tokenService,
  profileService,
  
  // Buyer services
  wishlistService,
  notificationService,
  messageService,
  reviewService,
  
  // Product services
  productService,
  imageService,
  
  // Landlord services
  landlordService,
  propertyService,
  viewingService,
  
  // Tutor services
  tutorService,
  sessionService,
  bookingService,
  
  // Doctor services
  doctorService,
  medicalServiceService,
  appointmentService,
  
  // Employer services
  employerService,
  jobService,
  applicationService,
  
  // Upload service
  uploadService
};
