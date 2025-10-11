/**
 * Standardized API response utility
 */
const sendResponse = (res, statusCode, success, message, data = null, errors = null) => {
  const response = {
    success,
    message,
    ...(data && { data }),
    ...(errors && { errors }),
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

/**
 * Success response
 */
const sendSuccess = (res, message = 'Operation successful', data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data);
};

/**
 * Error response
 */
const sendError = (res, message = 'Operation failed', errors = null, statusCode = 400) => {
  return sendResponse(res, statusCode, false, message, null, errors);
};

/**
 * Validation error response
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
  return sendError(res, message, errors, 422);
};

/**
 * Unauthorized error response
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(res, message, null, 401);
};

/**
 * Forbidden error response
 */
const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(res, message, null, 403);
};

/**
 * Not found error response
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, null, 404);
};

/**
 * Internal server error response
 */
const sendServerError = (res, message = 'Internal server error') => {
  return sendError(res, message, null, 500);
};

/**
 * Created response
 */
const sendCreated = (res, message = 'Resource created successfully', data = null) => {
  return sendSuccess(res, message, data, 201);
};

/**
 * No content response
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

module.exports = {
  sendResponse,
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendServerError,
  sendCreated,
  sendNoContent
};
