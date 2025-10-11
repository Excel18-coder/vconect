/**
 * Wishlist Service
 * Handles all wishlist business logic
 */

const wishlistRepository = require('../../repositories/wishlistRepository');
const logger = require('../../utils/logger');
const { NotFoundError, ValidationError, ConflictError, AuthorizationError } = require('../../errors');

class WishlistService {
  /**
   * Create new wishlist
   */
  async createWishlist(userId, wishlistData) {
    logger.debug('Creating wishlist', { userId });

    const { name, description, is_public = false } = wishlistData;

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Wishlist name is required');
    }

    const wishlist = await wishlistRepository.create({
      user_id: userId,
      name: name.trim(),
      description: description?.trim() || null,
      is_public
    });

    logger.info('Wishlist created', { userId, wishlistId: wishlist.id });

    return wishlist;
  }

  /**
   * Get user's wishlists with item counts
   */
  async getUserWishlists(userId) {
    logger.debug('Getting user wishlists', { userId });

    const wishlists = await wishlistRepository.findByUserIdWithCount(userId);

    return wishlists;
  }

  /**
   * Get wishlist by ID (with ownership check)
   */
  async getWishlist(wishlistId, userId) {
    logger.debug('Getting wishlist', { wishlistId, userId });

    const wishlist = await wishlistRepository.findById(wishlistId);

    if (!wishlist) {
      throw new NotFoundError('Wishlist not found');
    }

    // Check ownership
    if (wishlist.user_id !== userId) {
      throw new AuthorizationError('Not authorized to access this wishlist');
    }

    return wishlist;
  }

  /**
   * Add item to wishlist
   */
  async addItemToWishlist(userId, itemData) {
    logger.debug('Adding item to wishlist', { userId, itemData });

    const {
      wishlist_id,
      listing_id,
      property_id,
      job_id,
      notes,
      priority = 'medium'
    } = itemData;

    // Verify wishlist ownership
    const wishlist = await this.getWishlist(wishlist_id, userId);

    // Validate that at least one item ID is provided
    if (!listing_id && !property_id && !job_id) {
      throw new ValidationError('At least one item reference (listing_id, property_id, or job_id) is required');
    }

    // Check if item already exists in wishlist
    const existingItem = await wishlistRepository.findItemInWishlist(
      wishlist_id,
      { listing_id, property_id, job_id }
    );

    if (existingItem) {
      throw new ConflictError('Item already exists in wishlist');
    }

    // Add item to wishlist
    const item = await wishlistRepository.addItem({
      wishlist_id,
      listing_id: listing_id || null,
      property_id: property_id || null,
      job_id: job_id || null,
      notes: notes?.trim() || null,
      priority
    });

    logger.info('Item added to wishlist', { userId, wishlistId: wishlist_id, itemId: item.id });

    return item;
  }

  /**
   * Get wishlist items with details
   */
  async getWishlistItems(wishlistId, userId) {
    logger.debug('Getting wishlist items', { wishlistId, userId });

    // Verify ownership
    await this.getWishlist(wishlistId, userId);

    // Get items with all related details
    const items = await wishlistRepository.getItemsWithDetails(wishlistId);

    return items;
  }

  /**
   * Remove item from wishlist
   */
  async removeItemFromWishlist(itemId, userId) {
    logger.debug('Removing item from wishlist', { itemId, userId });

    // Verify ownership through wishlist
    const item = await wishlistRepository.findItemById(itemId);

    if (!item) {
      throw new NotFoundError('Wishlist item not found');
    }

    const wishlist = await wishlistRepository.findById(item.wishlist_id);

    if (!wishlist || wishlist.user_id !== userId) {
      throw new AuthorizationError('Not authorized to remove this item');
    }

    // Remove item
    await wishlistRepository.removeItem(itemId);

    logger.info('Item removed from wishlist', { userId, itemId });

    return { message: 'Item removed successfully' };
  }

  /**
   * Update wishlist
   */
  async updateWishlist(wishlistId, userId, updateData) {
    logger.debug('Updating wishlist', { wishlistId, userId });

    // Verify ownership
    await this.getWishlist(wishlistId, userId);

    const allowedFields = ['name', 'description', 'is_public'];
    const updates = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates[key] = key === 'name' || key === 'description' 
          ? value?.trim() 
          : value;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const updatedWishlist = await wishlistRepository.update(wishlistId, updates);

    logger.info('Wishlist updated', { userId, wishlistId });

    return updatedWishlist;
  }

  /**
   * Delete wishlist
   */
  async deleteWishlist(wishlistId, userId) {
    logger.debug('Deleting wishlist', { wishlistId, userId });

    // Verify ownership
    await this.getWishlist(wishlistId, userId);

    // Delete wishlist (cascade will delete items)
    await wishlistRepository.delete(wishlistId);

    logger.info('Wishlist deleted', { userId, wishlistId });

    return { message: 'Wishlist deleted successfully' };
  }
}

module.exports = new WishlistService();
