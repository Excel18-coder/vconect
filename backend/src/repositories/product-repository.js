/**
 * Product Repository
 * Handles all database operations for products/listings
 * Separates SQL queries from business logic
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class ProductRepository {
  /**
   * Create a new product listing
   */
  async create(productData) {
    try {
      const result = await sql`
        INSERT INTO listings (
          user_id, category_id, title, description, price, currency,
          condition, location, images, product_code, brand, model,
          color, size, weight, dimensions, material, warranty_period,
          warranty_type, stock_quantity, min_order_quantity, max_order_quantity,
          discount_percentage, discount_end_date, tags, seo_title,
          seo_description, shipping_included, shipping_cost, return_policy,
          is_digital, download_url, contact_phone, contact_email, negotiable,
          status
        ) VALUES (
          ${productData.user_id}, ${productData.category_id}, ${productData.title},
          ${productData.description}, ${productData.price}, ${productData.currency},
          ${productData.condition}, ${productData.location}, ${productData.images},
          ${productData.product_code}, ${productData.brand}, ${productData.model},
          ${productData.color}, ${productData.size}, ${productData.weight},
          ${productData.dimensions}, ${productData.material}, ${productData.warranty_period},
          ${productData.warranty_type}, ${productData.stock_quantity},
          ${productData.min_order_quantity}, ${productData.max_order_quantity},
          ${productData.discount_percentage}, ${productData.discount_end_date},
          ${productData.tags}, ${productData.seo_title}, ${productData.seo_description},
          ${productData.shipping_included}, ${productData.shipping_cost},
          ${productData.return_policy}, ${productData.is_digital}, ${productData.download_url},
          ${productData.contact_phone}, ${productData.contact_email}, ${productData.negotiable},
          ${productData.status || 'active'}
        )
        RETURNING *
      `;
      
      logger.debug('Product created in database', { productId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create product in database', error);
      throw error;
    }
  }

  /**
   * Find product by ID
   */
  async findById(productId) {
    try {
      const result = await sql`
        SELECT 
          l.*,
          c.name as category_name,
          c.slug as category_slug,
          p.display_name as seller_name,
          p.location as seller_location,
          u.email as seller_email
        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        LEFT JOIN profiles p ON l.user_id = p.user_id
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.id = ${productId}
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find product by ID', error, { productId });
      throw error;
    }
  }

  /**
   * Find products by user ID (seller's products)
   */
  async findByUserId(userId, { limit = 20, offset = 0 }) {
    try {
      const products = await sql`
        SELECT 
          l.*,
          c.name as category_name,
          c.slug as category_slug
        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        WHERE l.user_id = ${userId}
        ORDER BY l.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
      
      const countResult = await sql`
        SELECT COUNT(*) as total
        FROM listings
        WHERE user_id = ${userId}
      `;
      
      return {
        products,
        total: parseInt(countResult[0]?.total || 0)
      };
    } catch (error) {
      logger.error('Failed to find products by user ID', error, { userId });
      throw error;
    }
  }

  /**
   * Browse all active products with filters
   */
  async browse({ limit = 20, offset = 0, status = 'active' }) {
    try {
      const products = await sql`
        SELECT 
          l.id,
          l.user_id,
          l.category_id,
          l.title,
          l.description,
          l.price,
          l.condition,
          l.location,
          l.images,
          l.tags,
          l.status,
          l.views_count as views,
          l.created_at,
          l.updated_at,
          l.discount_percentage,
          c.name as category,
          c.slug as subcategory,
          p.display_name as seller_name,
          p.location as seller_location,
          u.email as seller_email
        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        LEFT JOIN profiles p ON l.user_id = p.user_id
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.status = ${status}
        ORDER BY l.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const countResult = await sql`
        SELECT COUNT(*) as total 
        FROM listings
        WHERE status = ${status}
      `;
      
      return {
        products,
        total: parseInt(countResult[0]?.total || 0)
      };
    } catch (error) {
      logger.error('Failed to browse products', error);
      throw error;
    }
  }

  /**
   * Update product by ID
   */
  async update(productId, updateData) {
    try {
      // Build SET clause dynamically
      const fields = Object.keys(updateData);
      const setClause = fields.map(field => `${field} = $${fields.indexOf(field) + 2}`).join(', ');
      const values = [productId, ...Object.values(updateData)];
      
      const result = await sql`
        UPDATE listings 
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${productId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Product', productId);
      }
      
      logger.debug('Product updated in database', { productId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update product', error, { productId });
      throw error;
    }
  }

  /**
   * Delete product by ID
   */
  async delete(productId) {
    try {
      const result = await sql`
        DELETE FROM listings
        WHERE id = ${productId}
        RETURNING id
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Product', productId);
      }
      
      logger.debug('Product deleted from database', { productId });
      return true;
    } catch (error) {
      logger.error('Failed to delete product', error, { productId });
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViews(productId) {
    try {
      await sql`
        UPDATE listings
        SET views_count = views_count + 1
        WHERE id = ${productId}
      `;
      
      logger.debug('Product view count incremented', { productId });
    } catch (error) {
      logger.error('Failed to increment view count', error, { productId });
      // Don't throw - view counting is not critical
    }
  }

  /**
   * Find category by slug
   */
  async findCategoryBySlug(slug) {
    try {
      const result = await sql`
        SELECT id, name, slug
        FROM categories
        WHERE slug = ${slug}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find category by slug', error, { slug });
      throw error;
    }
  }
}

module.exports = new ProductRepository();
