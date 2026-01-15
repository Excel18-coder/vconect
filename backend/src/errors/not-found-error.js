const AppError = require('./app-error');

/**
 * Error thrown when a resource is not found
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier = '') {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

module.exports = NotFoundError;
