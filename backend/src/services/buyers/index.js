/**
 * Buyer Services Index
 * Exports all buyer-related services
 */

const wishlistService = require('./wishlistService');
const notificationService = require('./notificationService');
const messageService = require('./messageService');
const reviewService = require('./reviewService');

module.exports = {
  wishlistService,
  notificationService,
  messageService,
  reviewService
};
