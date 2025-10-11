/**
 * Doctor Services Index
 * Exports all doctor-related services
 */

const doctorService = require('./doctorService');
const medicalServiceService = require('./medicalServiceService');
const appointmentService = require('./appointmentService');

module.exports = {
  doctorService,
  medicalServiceService,
  appointmentService
};
