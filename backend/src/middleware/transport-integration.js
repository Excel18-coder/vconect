const logger = require('../utils/logger');

/**
 * Transport Integration Auth
 * Validates external transport system requests via API key
 */
const transportIntegrationAuth = (req, res, next) => {
  const apiKeyHeader = req.header('x-transport-api-key');
  const rawKeys = process.env.TRANSPORT_INTEGRATION_KEYS || '';
  const allowedKeys = rawKeys
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  if (!allowedKeys.length) {
    logger.warn('Transport integration keys not configured');
    return res.status(503).json({
      success: false,
      message: 'Transport integration is not configured',
    });
  }

  if (!apiKeyHeader || !allowedKeys.includes(apiKeyHeader)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized integration request',
    });
  }

  return next();
};

module.exports = { transportIntegrationAuth };