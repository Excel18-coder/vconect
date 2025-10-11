/**
 * Custom Error Classes
 * Centralized error handling for consistent error responses
 */

const AppError = require('./AppError');
const NotFoundError = require('./NotFoundError');
const ValidationError = require('./ValidationError');
const AuthenticationError = require('./AuthenticationError');
const AuthorizationError = require('./AuthorizationError');
const ConflictError = require('./ConflictError');

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError
};
