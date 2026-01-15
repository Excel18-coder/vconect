const AppError = require('./app-error');

/**
 * Error thrown when there's a conflict (e.g., duplicate entries)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

module.exports = ConflictError;
