/**
 * Authentication Service
 * Handles all authentication business logic
 */

const userRepository = require('../../repositories/userRepository');
const tokenService = require('./tokenService');
const {
  hashPassword,
  comparePassword,
  generateVerificationToken,
  generatePasswordResetToken,
} = require('../../utils/auth');
const logger = require('../../utils/logger');
const {
  NotFoundError,
  AuthenticationError,
  ConflictError,
  ValidationError,
} = require('../../errors');

class AuthService {
  /**
   * Register a new user
   */
  async register({ email, password, displayName, userType = 'buyer' }) {
    logger.debug('Starting user registration', { email, userType });

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user
    const user = await userRepository.create({
      email,
      password_hash: passwordHash,
      role: userType,
      is_verified: false,
      verification_token: verificationToken,
    });

    // Create user profile
    await userRepository.createProfile(user.id, {
      display_name: displayName || email.split('@')[0],
      user_type: userType,
    });

    // Generate tokens
    const tokens = await tokenService.generateAuthTokens(user);

    logger.info('User registered successfully', { userId: user.id, email });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
      tokens,
      verificationToken, // In production, send this via email instead
    };
  }

  /**
   * Login user
   */
  async login({ email, password }) {
    logger.debug('User login attempt', { email });

    // Find user by email
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const tokens = await tokenService.generateAuthTokens(user);

    // Clear old sessions and store new refresh token
    await tokenService.replaceUserSessions(user.id, tokens.refreshToken);

    logger.info('User logged in successfully', { userId: user.id, email });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
      },
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    logger.debug('Refreshing access token');

    // Verify and get new access token
    const newAccessToken = await tokenService.refreshAccessToken(refreshToken);

    logger.debug('Access token refreshed successfully');

    return {
      accessToken: newAccessToken,
    };
  }

  /**
   * Logout user (remove single refresh token)
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await tokenService.removeRefreshToken(refreshToken);
      logger.debug('User logged out successfully');
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId) {
    await tokenService.removeAllUserSessions(userId);
    logger.info('User logged out from all devices', { userId });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(verificationToken) {
    logger.debug('Verifying email with token');

    const user = await userRepository.findByVerificationToken(verificationToken);
    if (!user) {
      throw new NotFoundError('Invalid verification token');
    }

    if (user.is_verified) {
      throw new ValidationError('Email already verified');
    }

    // Update user as verified
    const updatedUser = await userRepository.verifyEmail(user.id);

    logger.info('Email verified successfully', { userId: user.id });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      isVerified: updatedUser.is_verified,
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    logger.debug('Password reset requested', { email });

    // Find user (don't reveal if exists or not for security)
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Return success anyway (don't reveal if email exists)
      logger.debug('Password reset requested for non-existent email', { email });
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await userRepository.setPasswordResetToken(user.id, resetToken, resetExpires);

    logger.info('Password reset token generated', { userId: user.id });

    // In production, send this via email
    return {
      message: 'If the email exists, a password reset link has been sent',
      resetToken, // Remove this in production
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetToken, newPassword) {
    logger.debug('Resetting password with token');

    // Find user with reset token
    const user = await userRepository.findByResetToken(resetToken);
    if (!user) {
      throw new NotFoundError('Invalid reset token');
    }

    // Check if token is expired
    if (new Date() > new Date(user.reset_password_expires)) {
      throw new ValidationError('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await userRepository.updatePassword(user.id, passwordHash);
    await userRepository.clearPasswordResetToken(user.id);

    // Clear all user sessions (force re-login)
    await tokenService.removeAllUserSessions(user.id);

    logger.info('Password reset successfully', { userId: user.id });

    return {
      message: 'Password reset successfully',
    };
  }

  /**
   * Get current user information
   */
  async getMe(userId) {
    logger.debug('Getting current user info', { userId });

    const user = await userRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
      profile: {
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        userType: user.user_type,
        phoneNumber: user.phone_number,
        location: user.location,
        createdAt: user.profile_created_at,
      },
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    logger.debug('Changing password', { userId });

    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await userRepository.updatePassword(userId, hashedPassword);

    // Invalidate all sessions for security
    await sessionRepository.deleteAllUserSessions(userId);

    logger.info('Password changed successfully', { userId });

    return { message: 'Password changed successfully. Please log in again.' };
  }
}

module.exports = new AuthService();
