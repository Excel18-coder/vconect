/**
 * Configuration Manager
 * Centralized configuration with validation
 */

const logger = require('../utils/logger');

class Config {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.port = parseInt(process.env.PORT || '5000', 10);
    
    // Database
    this.database = {
      url: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true'
    };

    // JWT
    this.jwt = {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    };

    // Cloudinary
    this.cloudinary = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    };

    // Server
    this.server = {
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8080,http://localhost:8081,http://localhost:8082').split(','),
      apiPrefix: '/api',
      uploadsDir: 'uploads/',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) // 10MB
    };

    // Rate Limiting
    this.rateLimit = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
    };

    // Pagination
    this.pagination = {
      defaultLimit: 20,
      maxLimit: 100
    };

    this.validate();
  }

  validate() {
    const required = [
      { key: 'DATABASE_URL', value: this.database.url },
      { key: 'JWT_SECRET', value: this.jwt.secret },
      { key: 'CLOUDINARY_CLOUD_NAME', value: this.cloudinary.cloudName },
      { key: 'CLOUDINARY_API_KEY', value: this.cloudinary.apiKey },
      { key: 'CLOUDINARY_API_SECRET', value: this.cloudinary.apiSecret }
    ];

    const missing = required.filter(({ value }) => !value);

    if (missing.length > 0) {
      const missingKeys = missing.map(({ key }) => key).join(', ');
      logger.error(`Missing required environment variables: ${missingKeys}`);
      throw new Error(`Configuration Error: Missing required environment variables: ${missingKeys}`);
    }

    logger.success('Configuration validated successfully');
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isProduction() {
    return this.env === 'production';
  }

  isTest() {
    return this.env === 'test';
  }
}

module.exports = new Config();
