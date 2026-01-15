/**
 * Request Validation Middleware
 * Centralized validation using express-validator patterns
 *
 * Features:
 * - Input sanitization
 * - Type validation
 * - Custom validation rules
 * - Comprehensive error messages
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('../errors');
const logger = require('../utils/logger');

/**
 * Middleware to handle validation results
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param || error.path,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    logger.warn('Validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      ip: req.ip,
    });

    throw new ValidationError('Validation failed', formattedErrors);
  }

  next();
};

/**
 * Sanitizes string input
 * @param {string} value - Input value
 * @returns {string} Sanitized value
 */
const sanitizeString = value => {
  if (typeof value !== 'string') return value;

  return value
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 10000); // Prevent extremely long strings
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320; // RFC 5321
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePasswordStrength = password => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak',
  };
};

/**
 * Validates UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean}
 */
const isValidUUID = uuid => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates phone number (international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
const isValidPhone = phone => {
  // Basic international phone validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
};

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
const isValidUrl = url => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitizes object by removing undefined and null values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = obj => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== undefined && obj[key] !== null) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Validates pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Validated pagination params
 */
const validatePagination = (page, limit) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

  return {
    page: validatedPage,
    limit: validatedLimit,
    offset: (validatedPage - 1) * validatedLimit,
  };
};

module.exports = {
  handleValidationErrors,
  sanitizeString,
  isValidEmail,
  validatePasswordStrength,
  isValidUUID,
  isValidPhone,
  isValidUrl,
  sanitizeObject,
  validatePagination,
};
