/**
 * Landlord Services Index
 * Exports all landlord-related services
 */

const landlordService = require('./landlordService');
const propertyService = require('./propertyService');
const viewingService = require('./viewingService');

module.exports = {
  landlordService,
  propertyService,
  viewingService
};
