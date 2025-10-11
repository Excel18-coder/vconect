/**
 * Session Service
 * Business logic for tutoring sessions management
 */

const sessionRepository = require('../../repositories/sessionRepository');
const tutorRepository = require('../../repositories/tutorRepository');
const imageService = require('../products/imageService');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../errors');

class SessionService {
  /**
   * Create session
   */
  async createSession(tutorId, sessionData, images = []) {
    logger.debug('Creating tutoring session', { tutorId });

    // Validate required fields
    if (!sessionData.title || sessionData.title.trim().length === 0) {
      throw new ValidationError('Session title is required');
    }
    if (!sessionData.subject || sessionData.subject.trim().length === 0) {
      throw new ValidationError('Subject is required');
    }
    if (!sessionData.duration_minutes || sessionData.duration_minutes <= 0) {
      throw new ValidationError('Valid duration is required');
    }
    if (!sessionData.price || sessionData.price < 0) {
      throw new ValidationError('Valid price is required');
    }

    // Validate session type
    const validTypes = ['one-on-one', 'group', 'course'];
    if (!sessionData.session_type || !validTypes.includes(sessionData.session_type)) {
      throw new ValidationError(`Session type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate level
    const validLevels = ['beginner', 'intermediate', 'advanced', 'all'];
    if (sessionData.level && !validLevels.includes(sessionData.level)) {
      throw new ValidationError(`Level must be one of: ${validLevels.join(', ')}`);
    }

    // Validate mode
    const validModes = ['online', 'in-person', 'hybrid'];
    if (sessionData.mode && !validModes.includes(sessionData.mode)) {
      throw new ValidationError(`Mode must be one of: ${validModes.join(', ')}`);
    }

    // Verify tutor profile exists
    const tutor = await tutorRepository.findByUserId(tutorId);
    if (!tutor) {
      throw new NotFoundError('Tutor profile not found. Please create your tutor profile first.');
    }

    try {
      // Upload images if provided
      let imageUrls = [];
      if (images && images.length > 0) {
        const uploadedImages = await imageService.uploadImages(images, 'tutoring');
        imageUrls = uploadedImages.map(img => img.url);
      }

      // Create session
      const session = await sessionRepository.create({
        tutor_id: tutorId,
        title: sessionData.title,
        description: sessionData.description || null,
        subject: sessionData.subject,
        level: sessionData.level || 'all',
        session_type: sessionData.session_type,
        duration_minutes: sessionData.duration_minutes,
        price: sessionData.price,
        currency: sessionData.currency || 'KES',
        max_students: sessionData.max_students || 1,
        mode: sessionData.mode || 'online',
        location: sessionData.location || null,
        materials_included: sessionData.materials_included || [],
        prerequisites: sessionData.prerequisites || [],
        tags: sessionData.tags || [],
        images: imageUrls,
        status: 'active'
      });

      logger.info('Tutoring session created', { sessionId: session.id, tutorId });
      return session;
    } catch (error) {
      logger.error('Failed to create session', error, { tutorId });
      throw error;
    }
  }

  /**
   * Get tutor's sessions
   */
  async getTutorSessions(tutorId, filters = {}) {
    logger.debug('Getting tutor sessions', { tutorId });

    try {
      const sessions = await sessionRepository.findByTutorId(tutorId, filters);
      return sessions;
    } catch (error) {
      logger.error('Failed to get tutor sessions', error, { tutorId });
      throw error;
    }
  }

  /**
   * Browse sessions (for students)
   */
  async browseSessions(filters = {}) {
    logger.debug('Browsing tutoring sessions', filters);

    try {
      // Set defaults
      const searchFilters = {
        status: 'active',
        subject: filters.subject || null,
        level: filters.level || null,
        mode: filters.mode || null,
        min_price: filters.min_price ? parseFloat(filters.min_price) : null,
        max_price: filters.max_price ? parseFloat(filters.max_price) : null,
        limit: parseInt(filters.limit) || 20,
        offset: filters.page ? (parseInt(filters.page) - 1) * (parseInt(filters.limit) || 20) : 0
      };

      const sessions = await sessionRepository.search(searchFilters);
      const total = await sessionRepository.countSearch(searchFilters);

      return {
        sessions,
        total,
        page: filters.page ? parseInt(filters.page) : 1,
        limit: searchFilters.limit,
        pages: Math.ceil(total / searchFilters.limit)
      };
    } catch (error) {
      logger.error('Failed to browse sessions', error, filters);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    logger.debug('Getting session', { sessionId });

    try {
      const session = await sessionRepository.findByIdWithDetails(sessionId);
      
      if (!session) {
        throw new NotFoundError('Session', sessionId);
      }

      return session;
    } catch (error) {
      logger.error('Failed to get session', error, { sessionId });
      throw error;
    }
  }

  /**
   * Update session
   */
  async updateSession(sessionId, userId, updateData) {
    logger.debug('Updating session', { sessionId, userId });

    try {
      // Get session and verify ownership
      const session = await sessionRepository.findById(sessionId);
      if (!session) {
        throw new NotFoundError('Session', sessionId);
      }

      if (session.tutor_id !== userId) {
        throw new AuthorizationError('You can only update your own sessions');
      }

      // Validate status if being updated
      if (updateData.status) {
        const validStatuses = ['active', 'paused', 'completed'];
        if (!validStatuses.includes(updateData.status)) {
          throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
        }
      }

      const updated = await sessionRepository.update(sessionId, updateData);
      logger.info('Session updated', { sessionId, userId });

      return updated;
    } catch (error) {
      logger.error('Failed to update session', error, { sessionId, userId });
      throw error;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId, userId) {
    logger.debug('Deleting session', { sessionId, userId });

    try {
      // Get session and verify ownership
      const session = await sessionRepository.findById(sessionId);
      if (!session) {
        throw new NotFoundError('Session', sessionId);
      }

      if (session.tutor_id !== userId) {
        throw new AuthorizationError('You can only delete your own sessions');
      }

      // Soft delete by setting status to inactive
      await sessionRepository.update(sessionId, { status: 'inactive' });
      logger.info('Session soft deleted', { sessionId, userId });

      return true;
    } catch (error) {
      logger.error('Failed to delete session', error, { sessionId, userId });
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId) {
    logger.debug('Getting session statistics', { sessionId });

    try {
      const stats = await sessionRepository.getStatistics(sessionId);
      return stats;
    } catch (error) {
      logger.error('Failed to get session statistics', error, { sessionId });
      throw error;
    }
  }
}

module.exports = new SessionService();
