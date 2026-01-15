const AppError = require('./app-error');

/**
 * Validation Error Class
 * Used for input validation failures with field-level error support
 *
 * @class ValidationError
 * @extends {AppError}
 * @property {Object|Array} errors - Validation errors by field
 */
class ValidationError extends AppError {
  /**
   * Creates a ValidationError
   * @param {string} [message='Validation failed'] - Error message
   * @param {Object|Array} [errors={}] - Field-specific errors
   */
  constructor(message = 'Validation failed', errors = {}) {
    super(message, 400, true);
    this.name = 'ValidationError';
    this.errors = this.normalizeErrors(errors);
  }

  /**
   * Normalizes error formats from different validation libraries
   * @private
   * @param {Object|Array} errors - Raw validation errors
   * @returns {Object|Array} Normalized errors
   */
  normalizeErrors(errors) {
    if (Array.isArray(errors)) {
      return errors.map(error => {
        if (typeof error === 'string') {
          return { field: 'general', message: error };
        }
        return {
          field: error.field || error.path || error.param || 'unknown',
          message: error.message || error.msg || String(error),
          ...(error.value !== undefined && { value: error.value }),
        };
      });
    }
    return errors;
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
      errors: this.errors,
      timestamp: this.timestamp,
    };
  }
}

module.exports = ValidationError;
