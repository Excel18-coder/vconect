/**
 * Main DTOs export file
 * Central place to import all DTOs
 */

const userDto = require('./user-dto');
const productDto = require('./product-dto');
const profileDto = require('./profile-dto');
const orderDto = require('./order-dto');

module.exports = {
  // User DTOs
  ...userDto,

  // Product DTOs
  ...productDto,

  // Profile DTOs
  ...profileDto,

  // Order DTOs
  ...orderDto,
};
