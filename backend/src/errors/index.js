/**
 * Custom Error Classes
 * Centralized error handling for consistent error responses
 */

const AppError = require('./app-error');
const NotFoundError = require('./not-found-error');
const ValidationError = require('./validation-error');
const AuthenticationError = require('./authentication-error');
const AuthorizationError = require('./authorization-error');
const ConflictError = require('./conflict-error');

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
};
