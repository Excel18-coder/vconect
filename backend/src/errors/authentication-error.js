const AppError = require('./app-error');

/**
 * Authentication Error Class
 * Used for authentication failures (invalid credentials, expired tokens, etc.)
 *
 * @class AuthenticationError
 * @extends {AppError}
 */
class AuthenticationError extends AppError {
  /**
   * Creates an AuthenticationError
   * @param {string} [message='Authentication failed'] - Error message
   * @param {Object} [metadata] - Additional context (e.g., reason, attempt count)
   */
  constructor(message = 'Authentication failed', metadata = {}) {
    super(message, 401, true);
    this.name = 'AuthenticationError';
    this.metadata = metadata;
  }

  /**
   * Converts error to JSON format
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(Object.keys(this.metadata).length > 0 && { metadata: this.metadata }),
    };
  }
}

module.exports = AuthenticationError;
