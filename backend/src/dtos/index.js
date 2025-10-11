/**
 * Main DTOs export file
 * Central place to import all DTOs
 */

const userDto = require('./userDto');
const productDto = require('./productDto');
const profileDto = require('./profileDto');
const orderDto = require('./orderDto');
const reviewDto = require('./reviewDto');

module.exports = {
  // User DTOs
  ...userDto,
  
  // Product DTOs
  ...productDto,
  
  // Profile DTOs
  ...profileDto,
  
  // Order DTOs
  ...orderDto,
  
  // Review DTOs
  ...reviewDto
};
