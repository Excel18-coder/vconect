/**
 * Services Index
 * Main barrel export for all services
 */

// User services
const { authService, tokenService, profileService } = require('./users');

// Buyer services
const { messageService } = require('./buyers');

// Product services
const { productService, imageService } = require('./products');

// Upload service
const uploadService = require('./upload/upload-service');

module.exports = {
  // User services
  authService,
  tokenService,
  profileService,

  // Buyer services
  messageService,

  // Product services
  productService,
  imageService,

  // Upload service
  uploadService,
};
