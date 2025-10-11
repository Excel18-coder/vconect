/**
 * Wishlist Repository
 * Handles all database operations for wishlists
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class WishlistRepository {
  /**
   * Create new wishlist
   */
  async create(wishlistData) {
    try {
      const result = await sql`
        INSERT INTO wishlists (user_id, name, description, is_public)
        VALUES (${wishlistData.user_id}, ${wishlistData.name}, ${wishlistData.description}, ${wishlistData.is_public})
        RETURNING *
      `;
      
      logger.debug('Wishlist created in database', { wishlistId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create wishlist', error, { userId: wishlistData.user_id });
      throw error;
    }
  }

  /**
   * Find wishlist by ID
   */
  async findById(wishlistId) {
    try {
      const result = await sql`
        SELECT * FROM wishlists
        WHERE id = ${wishlistId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find wishlist', error, { wishlistId });
      throw error;
    }
  }

  /**
   * Find user's wishlists with item counts
   */
  async findByUserIdWithCount(userId) {
    try {
      const result = await sql`
        SELECT w.*, COUNT(wi.id)::INTEGER as items_count
        FROM wishlists w
        LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
        WHERE w.user_id = ${userId}
        GROUP BY w.id
        ORDER BY w.created_at DESC
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find user wishlists', error, { userId });
      throw error;
    }
  }

  /**
   * Find item in wishlist
   */
  async findItemInWishlist(wishlistId, itemIdentifiers) {
    try {
      const { listing_id, property_id, job_id } = itemIdentifiers;

      if (listing_id) {
        const result = await sql`
          SELECT * FROM wishlist_items
          WHERE wishlist_id = ${wishlistId} AND listing_id = ${listing_id}
          LIMIT 1
        `;
        return result[0] || null;
      }

      if (property_id) {
        const result = await sql`
          SELECT * FROM wishlist_items
          WHERE wishlist_id = ${wishlistId} AND property_id = ${property_id}
          LIMIT 1
        `;
        return result[0] || null;
      }

      if (job_id) {
        const result = await sql`
          SELECT * FROM wishlist_items
          WHERE wishlist_id = ${wishlistId} AND job_id = ${job_id}
          LIMIT 1
        `;
        return result[0] || null;
      }

      return null;
    } catch (error) {
      logger.error('Failed to find item in wishlist', error, { wishlistId });
      throw error;
    }
  }

  /**
   * Add item to wishlist
   */
  async addItem(itemData) {
    try {
      const result = await sql`
        INSERT INTO wishlist_items (
          wishlist_id, listing_id, property_id, job_id, notes, priority
        ) VALUES (
          ${itemData.wishlist_id}, 
          ${itemData.listing_id}, 
          ${itemData.property_id}, 
          ${itemData.job_id}, 
          ${itemData.notes}, 
          ${itemData.priority}
        )
        RETURNING *
      `;
      
      logger.debug('Item added to wishlist in database', { itemId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to add item to wishlist', error, itemData);
      throw error;
    }
  }

  /**
   * Get wishlist items with all details
   */
  async getItemsWithDetails(wishlistId) {
    try {
      const result = await sql`
        SELECT 
          wi.*,
          p.title as product_title,
          p.description as product_description,
          p.price as product_price,
          p.images as product_images,
          p.status as product_status,
          prop.title as property_title,
          prop.description as property_description,
          prop.price as property_price,
          prop.images as property_images,
          prop.status as property_status,
          jp.title as job_title,
          jp.description as job_description,
          jp.salary_min as job_salary_min,
          jp.salary_max as job_salary_max,
          jp.status as job_status
        FROM wishlist_items wi
        LEFT JOIN products p ON wi.listing_id = p.id
        LEFT JOIN properties prop ON wi.property_id = prop.id
        LEFT JOIN job_postings jp ON wi.job_id = jp.id
        WHERE wi.wishlist_id = ${wishlistId}
        ORDER BY wi.created_at DESC
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to get wishlist items with details', error, { wishlistId });
      throw error;
    }
  }

  /**
   * Find wishlist item by ID
   */
  async findItemById(itemId) {
    try {
      const result = await sql`
        SELECT * FROM wishlist_items
        WHERE id = ${itemId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find wishlist item', error, { itemId });
      throw error;
    }
  }

  /**
   * Remove item from wishlist
   */
  async removeItem(itemId) {
    try {
      await sql`
        DELETE FROM wishlist_items
        WHERE id = ${itemId}
      `;
      
      logger.debug('Item removed from wishlist in database', { itemId });
      return true;
    } catch (error) {
      logger.error('Failed to remove item from wishlist', error, { itemId });
      throw error;
    }
  }

  /**
   * Update wishlist
   */
  async update(wishlistId, updateData) {
    try {
      const result = await sql`
        UPDATE wishlists
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${wishlistId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Wishlist', wishlistId);
      }
      
      logger.debug('Wishlist updated in database', { wishlistId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update wishlist', error, { wishlistId });
      throw error;
    }
  }

  /**
   * Delete wishlist
   */
  async delete(wishlistId) {
    try {
      // Delete items first (or rely on CASCADE if configured)
      await sql`DELETE FROM wishlist_items WHERE wishlist_id = ${wishlistId}`;
      
      // Delete wishlist
      await sql`DELETE FROM wishlists WHERE id = ${wishlistId}`;
      
      logger.debug('Wishlist deleted from database', { wishlistId });
      return true;
    } catch (error) {
      logger.error('Failed to delete wishlist', error, { wishlistId });
      throw error;
    }
  }
}

module.exports = new WishlistRepository();
