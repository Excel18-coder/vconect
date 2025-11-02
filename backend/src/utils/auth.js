const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Validate JWT secrets are available
 * @throws {Error} If secrets are not configured
 */
const validateJWTSecrets = () => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ CRITICAL ERROR: JWT_SECRET is not defined in environment variables!');
    console.error('📋 This must be set in your Render dashboard Environment tab');
    console.error('🔑 Variable name: JWT_SECRET');
    console.error('📝 Example value: (64+ character random string)');
    throw new Error('JWT_SECRET environment variable is required but not defined');
  }
  
  if (!process.env.JWT_REFRESH_SECRET) {
    console.error('❌ CRITICAL ERROR: JWT_REFRESH_SECRET is not defined in environment variables!');
    console.error('📋 This must be set in your Render dashboard Environment tab');
    console.error('🔑 Variable name: JWT_REFRESH_SECRET');
    throw new Error('JWT_REFRESH_SECRET environment variable is required but not defined');
  }
  
  // Validate secret length (should be at least 32 characters for security)
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET is too short (< 32 characters). Use a longer secret for better security.');
  }
  
  return true;
};

/**
 * Safe JWT sign wrapper with secret validation
 * @param {Object} payload - Data to encode in token
 * @param {string} secret - JWT secret
 * @param {Object} options - JWT sign options
 * @returns {string} Signed JWT token
 */
const safeJWTSign = (payload, secret, options) => {
  if (!secret) {
    throw new Error('JWT secret is undefined. Cannot sign token.');
  }
  return jwt.sign(payload, secret, options);
};

/**
 * Safe JWT verify wrapper with secret validation
 * @param {string} token - JWT token to verify
 * @param {string} secret - JWT secret
 * @returns {Object} Decoded token payload
 */
const safeJWTVerify = (token, secret) => {
  if (!secret) {
    throw new Error('JWT secret is undefined. Cannot verify token.');
  }
  return jwt.verify(token, secret);
};

/**
 * Generate JWT access token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  validateJWTSecrets();
  return safeJWTSign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  validateJWTSecrets();
  return safeJWTSign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};

/**
 * Verify JWT token
 * @param {string} token - Token to verify
 * @param {boolean} isRefreshToken - Whether this is a refresh token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, isRefreshToken = false) => {
  validateJWTSecrets();
  const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
  return safeJWTVerify(token, secret);
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate verification token
 */
const generateVerificationToken = () => {
  return uuidv4();
};

/**
 * Extract JWT token from request headers
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Generate password reset token
 */
const generatePasswordResetToken = () => {
  return uuidv4();
};

/**
 * Calculate token expiry time
 */
const calculateExpiryTime = (hours = 24) => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateVerificationToken,
  extractTokenFromHeader,
  generatePasswordResetToken,
  calculateExpiryTime
};
