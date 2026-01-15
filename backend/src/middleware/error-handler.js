const { sendServerError } = require('../utils/response');
const logger = require('../utils/logger');
const { AppError } = require('../errors');

/**
 * Global error handling middleware
 * Updated to work with custom error classes
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error caught by errorHandler', err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Handle our custom AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || undefined,
      timestamp: err.timestamp,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }

  // Mongoose/Sequelize ValidationError (if using ORM)
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message),
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access',
      timestamp: new Date().toISOString()
    });
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Invalid reference - related resource not found',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === '23502') { // Not null violation
    return res.status(400).json({
      success: false,
      message: 'Missing required field',
      timestamp: new Date().toISOString()
    });
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      message: 'Too many files',
      timestamp: new Date().toISOString()
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      timestamp: new Date().toISOString()
    });
  }

  // Neon database errors
  if (err.message && err.message.includes('Connection terminated')) {
    return res.status(503).json({
      success: false,
      message: 'Database connection error',
      timestamp: new Date().toISOString()
    });
  }

  // Default server error (unknown errors)
  logger.error('Unexpected error', err);
  return sendServerError(res, 
    process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  );
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper to catch async function errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
