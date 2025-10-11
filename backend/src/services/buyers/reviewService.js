/**
 * Review Service
 * Handles all user review business logic
 */

const reviewRepository = require('../../repositories/reviewRepository');
const userRepository = require('../../repositories/userRepository');
const logger = require('../../utils/logger');
const { NotFoundError, ValidationError, ConflictError, AuthorizationError } = require('../../errors');

class ReviewService {
  /**
   * Create user review
   */
  async createReview(reviewerId, reviewData) {
    logger.debug('Creating review', { reviewerId });

    const {
      reviewed_user_id,
      review_type,
      rating,
      review_title,
      review_text,
      booking_id
    } = reviewData;

    // Validate required fields
    if (!reviewed_user_id || !review_type || !rating) {
      throw new ValidationError('reviewed_user_id, review_type, and rating are required');
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    // Validate review type
    const validTypes = ['tutor', 'landlord', 'employer', 'doctor', 'seller', 'buyer'];
    if (!validTypes.includes(review_type)) {
      throw new ValidationError(`review_type must be one of: ${validTypes.join(', ')}`);
    }

    // Cannot review yourself
    if (reviewerId === reviewed_user_id) {
      throw new ValidationError('Cannot review yourself');
    }

    // Verify reviewed user exists
    const reviewedUser = await userRepository.findById(reviewed_user_id);
    if (!reviewedUser) {
      throw new NotFoundError('Reviewed user not found');
    }

    // Check if review already exists for this booking
    if (booking_id) {
      const existingReview = await reviewRepository.findByBooking(
        reviewerId,
        booking_id,
        review_type
      );
      
      if (existingReview) {
        throw new ConflictError('Review already submitted for this booking');
      }
    }

    // Create review
    const review = await reviewRepository.create({
      reviewer_id: reviewerId,
      reviewed_user_id,
      review_type,
      rating: parseFloat(rating),
      review_title: review_title?.trim() || null,
      review_text: review_text?.trim() || null,
      booking_id: booking_id || null
    });

    // Update profile rating based on review type
    try {
      await this.updateProfileRating(reviewed_user_id, review_type);
    } catch (error) {
      logger.error('Failed to update profile rating', error);
      // Don't fail review creation if rating update fails
    }

    logger.info('Review created', { 
      reviewerId, 
      reviewedUserId: reviewed_user_id,
      reviewId: review.id 
    });

    return review;
  }

  /**
   * Get user reviews
   */
  async getUserReviews(userId, filters = {}) {
    logger.debug('Getting user reviews', { userId, filters });

    const { review_type, limit = 50, offset = 0 } = filters;

    const reviews = await reviewRepository.findByUserId(userId, {
      review_type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return reviews;
  }

  /**
   * Get review by ID
   */
  async getReview(reviewId, userId = null) {
    logger.debug('Getting review', { reviewId });

    const review = await reviewRepository.findByIdWithDetails(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return review;
  }

  /**
   * Get review statistics for user
   */
  async getReviewStats(userId, reviewType = null) {
    logger.debug('Getting review stats', { userId, reviewType });

    const stats = await reviewRepository.getStatsForUser(userId, reviewType);

    return stats;
  }

  /**
   * Update review
   */
  async updateReview(reviewId, reviewerId, updateData) {
    logger.debug('Updating review', { reviewId, reviewerId });

    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Only reviewer can update their review
    if (review.reviewer_id !== reviewerId) {
      throw new AuthorizationError('Not authorized to update this review');
    }

    const allowedFields = ['rating', 'review_title', 'review_text'];
    const updates = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'rating') {
          const rating = parseFloat(value);
          if (rating < 1 || rating > 5) {
            throw new ValidationError('Rating must be between 1 and 5');
          }
          updates[key] = rating;
        } else {
          updates[key] = value?.trim();
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const updatedReview = await reviewRepository.update(reviewId, updates);

    // Update profile rating if rating changed
    if (updates.rating) {
      try {
        await this.updateProfileRating(review.reviewed_user_id, review.review_type);
      } catch (error) {
        logger.error('Failed to update profile rating', error);
      }
    }

    logger.info('Review updated', { reviewId, reviewerId });

    return updatedReview;
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId, reviewerId) {
    logger.debug('Deleting review', { reviewId, reviewerId });

    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Only reviewer can delete their review
    if (review.reviewer_id !== reviewerId) {
      throw new AuthorizationError('Not authorized to delete this review');
    }

    await reviewRepository.delete(reviewId);

    // Update profile rating after deletion
    try {
      await this.updateProfileRating(review.reviewed_user_id, review.review_type);
    } catch (error) {
      logger.error('Failed to update profile rating after deletion', error);
    }

    logger.info('Review deleted', { reviewId, reviewerId });

    return { message: 'Review deleted successfully' };
  }

  /**
   * Report review (flag as inappropriate)
   */
  async reportReview(reviewId, reporterId, reason) {
    logger.debug('Reporting review', { reviewId, reporterId });

    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    await reviewRepository.flagReview(reviewId, reporterId, reason);

    logger.info('Review reported', { reviewId, reporterId });

    return { message: 'Review reported successfully' };
  }

  /**
   * Update profile rating based on reviews
   * @private
   */
  async updateProfileRating(userId, reviewType) {
    logger.debug('Updating profile rating', { userId, reviewType });

    const stats = await reviewRepository.getStatsForUser(userId, reviewType);

    // Update appropriate profile table based on review type
    switch (reviewType) {
      case 'tutor':
        await reviewRepository.updateTutorRating(userId, stats.average_rating, stats.total_reviews);
        break;
      case 'landlord':
        await reviewRepository.updateLandlordRating(userId, stats.average_rating, stats.total_reviews);
        break;
      case 'employer':
        await reviewRepository.updateEmployerRating(userId, stats.average_rating, stats.total_reviews);
        break;
      case 'doctor':
        await reviewRepository.updateDoctorRating(userId, stats.average_rating, stats.total_reviews);
        break;
      default:
        logger.warn('Unknown review type for rating update', { reviewType });
    }

    logger.debug('Profile rating updated', { userId, reviewType, stats });
  }
}

module.exports = new ReviewService();
