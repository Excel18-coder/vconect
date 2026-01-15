/**
 * Token Service
 * Handles all JWT token operations and session management
 */

const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  calculateExpiryTime,
} = require('../../utils/auth');
const tokenRepository = require('../../repositories/token-repository');
const userRepository = require('../../repositories/user-repository');
const logger = require('../../utils/logger');
const { AuthenticationError } = require('../../errors');

class TokenService {
  /**
   * Generate access and refresh tokens
   */
  async generateAuthTokens(user) {
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    logger.debug('Auth tokens generated', { userId: user.id });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify refresh token and generate new access token
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken, true);

      // Check if refresh token exists in database
      const session = await tokenRepository.findByRefreshToken(refreshToken);
      if (!session || session.user_id !== decoded.userId) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Check if token is expired
      if (new Date() > new Date(session.expires_at)) {
        // Clean up expired token
        await tokenRepository.deleteByRefreshToken(refreshToken);
        throw new AuthenticationError('Refresh token expired');
      }

      // Get user details
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.debug('Access token refreshed', { userId: user.id });

      return newAccessToken;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error('Failed to refresh access token', error);
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Store refresh token in database
   */
  async storeRefreshToken(userId, refreshToken, expiresInHours = 24 * 30) {
    const expiresAt = calculateExpiryTime(expiresInHours);

    await tokenRepository.create({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    });

    logger.debug('Refresh token stored', { userId });
  }

  /**
   * Replace all user sessions with new refresh token
   */
  async replaceUserSessions(userId, newRefreshToken) {
    // Remove all existing sessions
    await tokenRepository.deleteByUserId(userId);

    // Store new refresh token
    await this.storeRefreshToken(userId, newRefreshToken);

    logger.debug('User sessions replaced', { userId });
  }

  /**
   * Remove specific refresh token
   */
  async removeRefreshToken(refreshToken) {
    await tokenRepository.deleteByRefreshToken(refreshToken);
    logger.debug('Refresh token removed');
  }

  /**
   * Remove all sessions for a user
   */
  async removeAllUserSessions(userId) {
    await tokenRepository.deleteByUserId(userId);
    logger.debug('All user sessions removed', { userId });
  }

  /**
   * Clean up expired tokens (can be run as a cron job)
   */
  async cleanupExpiredTokens() {
    const deletedCount = await tokenRepository.deleteExpired();
    logger.info('Expired tokens cleaned up', { deletedCount });
    return deletedCount;
  }

  /**
   * Verify access token
   */
  verifyAccessToken(accessToken) {
    try {
      const decoded = verifyToken(accessToken, false);
      return decoded;
    } catch (error) {
      logger.debug('Invalid access token', error);
      throw new AuthenticationError('Invalid access token');
    }
  }

  /**
   * Verify refresh token (without database check)
   */
  verifyRefreshTokenJWT(refreshToken) {
    try {
      const decoded = verifyToken(refreshToken, true);
      return decoded;
    } catch (error) {
      logger.debug('Invalid refresh token', error);
      throw new AuthenticationError('Invalid refresh token');
    }
  }
}

module.exports = new TokenService();
