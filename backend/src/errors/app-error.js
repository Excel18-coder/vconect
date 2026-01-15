/**
 * Base Application Error Class
 * All custom errors should extend from this class
 *
 * @class AppError
 * @extends {Error}
 * @property {string} message - Error message
 * @property {number} statusCode - HTTP status code
 * @property {boolean} isOperational - Whether error is operational (vs programming error)
 * @property {string} timestamp - ISO timestamp of when error occurred
 * @property {string} code - Error code for client-side handling
 * @property {Object} metadata - Additional error context
 */
class AppError extends Error {
  /**
   * Creates an instance of AppError
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {boolean} [isOperational=true] - Whether error is operational
   * @param {string} [code] - Error code for programmatic handling
   * @param {Object} [metadata={}] - Additional error context
   */
  constructor(message, statusCode = 500, isOperational = true, code = null, metadata = {}) {
    super(message);

    // Set the prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.code = code || this.constructor.name.toUpperCase();
    this.metadata = metadata;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to JSON-serializable format
   * @param {boolean} [includeStack=false] - Whether to include stack trace
   * @returns {Object} JSON representation of error
   */
  toJSON(includeStack = false) {
    const error = {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp,
      ...(Object.keys(this.metadata).length > 0 && { metadata: this.metadata }),
    };

    if (includeStack) {
      error.stack = this.stack;
    }

    return error;
  }
}

module.exports = AppError;
