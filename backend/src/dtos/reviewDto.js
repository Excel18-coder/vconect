/**
 * Review DTOs (Data Transfer Objects)
 * Transform review models to API responses
 */

/**
 * Review DTO - Transform review for API response
 * @param {Object} review - Review object from database
 * @returns {Object} Transformed review object
 */
const toReviewDto = (review) => {
  if (!review) return null;

  return {
    id: review.id,
    productId: review.product_id || review.productId,
    buyerId: review.buyer_id || review.buyerId,
    rating: parseInt(review.rating),
    comment: review.comment,
    images: review.images || [],
    isVerifiedPurchase: review.is_verified_purchase || review.isVerifiedPurchase || false,
    helpful: parseInt(review.helpful || 0),
    createdAt: review.created_at || review.createdAt,
    updatedAt: review.updated_at || review.updatedAt
  };
};

/**
 * Review with user DTO - Transform review with buyer info
 * @param {Object} review - Review object from database
 * @param {Object} buyer - Buyer object
 * @returns {Object} Review with buyer details
 */
const toReviewWithUser = (review, buyer = null) => {
  const reviewDto = toReviewDto(review);

  if (buyer) {
    reviewDto.buyer = {
      id: buyer.id,
      displayName: buyer.display_name || buyer.displayName,
      avatarUrl: buyer.avatar_url || buyer.avatarUrl
    };
  }

  return reviewDto;
};

/**
 * Review list DTO - Transform array of reviews
 * @param {Array} reviews - Array of review objects
 * @returns {Array} Array of transformed review objects
 */
const toReviewList = (reviews) => {
  if (!Array.isArray(reviews)) return [];
  return reviews.map(toReviewDto);
};

module.exports = {
  toReviewDto,
  toReviewWithUser,
  toReviewList
};
