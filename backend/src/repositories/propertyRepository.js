/**
 * Property Repository
 * Handles all database operations for properties
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class PropertyRepository {
  /**
   * Create property
   */
  async create(propertyData) {
    try {
      const result = await sql`
        INSERT INTO properties (
          landlord_id, title, description, property_type, listing_type,
          address, city, location, coordinates, price, currency,
          bedrooms, bathrooms, area_sqft, floor_number, total_floors,
          parking_spaces, furnished, pets_allowed, amenities, utilities_included,
          images, video_tour_url, virtual_tour_url, available_from,
          lease_duration, deposit_amount, tags, status
        )
        VALUES (
          ${propertyData.landlord_id}, ${propertyData.title}, ${propertyData.description}, 
          ${propertyData.property_type}, ${propertyData.listing_type},
          ${propertyData.address}, ${propertyData.city}, ${propertyData.location}, 
          ${propertyData.coordinates}, ${propertyData.price}, ${propertyData.currency},
          ${propertyData.bedrooms}, ${propertyData.bathrooms}, ${propertyData.area_sqft}, 
          ${propertyData.floor_number}, ${propertyData.total_floors},
          ${propertyData.parking_spaces}, ${propertyData.furnished}, ${propertyData.pets_allowed}, 
          ${propertyData.amenities}, ${propertyData.utilities_included},
          ${propertyData.images}, ${propertyData.video_tour_url}, ${propertyData.virtual_tour_url}, 
          ${propertyData.available_from},
          ${propertyData.lease_duration}, ${propertyData.deposit_amount}, ${propertyData.tags}, 
          ${propertyData.status}
        )
        RETURNING *
      `;
      
      logger.debug('Property created in database', { propertyId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create property', error, propertyData);
      throw error;
    }
  }

  /**
   * Find property by ID
   */
  async findById(propertyId) {
    try {
      const result = await sql`
        SELECT * FROM properties
        WHERE id = ${propertyId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find property', error, { propertyId });
      throw error;
    }
  }

  /**
   * Find property by ID with landlord details
   */
  async findByIdWithDetails(propertyId) {
    try {
      const result = await sql`
        SELECT 
          p.*,
          prof.display_name as landlord_name,
          prof.avatar_url as landlord_avatar,
          lp.company_name,
          lp.rating as landlord_rating,
          lp.verified as landlord_verified,
          u.email as landlord_email
        FROM properties p
        JOIN users u ON p.landlord_id = u.id
        JOIN profiles prof ON p.landlord_id = prof.user_id
        LEFT JOIN landlord_profiles lp ON p.landlord_id = lp.user_id
        WHERE p.id = ${propertyId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find property with details', error, { propertyId });
      throw error;
    }
  }

  /**
   * Find properties by landlord ID
   */
  async findByLandlordId(landlordId, options = {}) {
    try {
      const { status, limit = 20, offset = 0 } = options;

      let query = sql`
        SELECT * FROM properties
        WHERE landlord_id = ${landlordId}
      `;

      if (status) {
        query = sql`${query} AND status = ${status}`;
      }

      query = sql`
        ${query}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Failed to find properties by landlord', error, { landlordId });
      throw error;
    }
  }

  /**
   * Search properties
   */
  async search(filters) {
    try {
      let conditions = [sql`status = 'available'`];
      
      if (filters.property_type) {
        conditions.push(sql`property_type = ${filters.property_type}`);
      }
      if (filters.listing_type) {
        conditions.push(sql`listing_type = ${filters.listing_type}`);
      }
      if (filters.city) {
        conditions.push(sql`city ILIKE ${'%' + filters.city + '%'}`);
      }
      if (filters.location) {
        conditions.push(sql`location ILIKE ${'%' + filters.location + '%'}`);
      }
      if (filters.min_price !== undefined) {
        conditions.push(sql`price >= ${filters.min_price}`);
      }
      if (filters.max_price !== undefined) {
        conditions.push(sql`price <= ${filters.max_price}`);
      }
      if (filters.bedrooms !== undefined) {
        conditions.push(sql`bedrooms >= ${filters.bedrooms}`);
      }
      if (filters.bathrooms !== undefined) {
        conditions.push(sql`bathrooms >= ${filters.bathrooms}`);
      }
      if (filters.furnished !== undefined) {
        conditions.push(sql`furnished = ${filters.furnished}`);
      }
      if (filters.pets_allowed !== undefined) {
        conditions.push(sql`pets_allowed = ${filters.pets_allowed}`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT 
          p.*,
          prof.display_name as landlord_name,
          prof.avatar_url as landlord_avatar,
          lp.company_name,
          lp.rating as landlord_rating,
          u.email as landlord_email
        FROM properties p
        JOIN users u ON p.landlord_id = u.id
        JOIN profiles prof ON p.landlord_id = prof.user_id
        LEFT JOIN landlord_profiles lp ON p.landlord_id = lp.user_id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ${filters.limit} OFFSET ${filters.offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to search properties', error, filters);
      throw error;
    }
  }

  /**
   * Count search results
   */
  async countSearch(filters) {
    try {
      let conditions = [sql`status = 'available'`];
      
      if (filters.property_type) {
        conditions.push(sql`property_type = ${filters.property_type}`);
      }
      if (filters.listing_type) {
        conditions.push(sql`listing_type = ${filters.listing_type}`);
      }
      if (filters.city) {
        conditions.push(sql`city ILIKE ${'%' + filters.city + '%'}`);
      }
      if (filters.location) {
        conditions.push(sql`location ILIKE ${'%' + filters.location + '%'}`);
      }
      if (filters.min_price !== undefined) {
        conditions.push(sql`price >= ${filters.min_price}`);
      }
      if (filters.max_price !== undefined) {
        conditions.push(sql`price <= ${filters.max_price}`);
      }
      if (filters.bedrooms !== undefined) {
        conditions.push(sql`bedrooms >= ${filters.bedrooms}`);
      }
      if (filters.bathrooms !== undefined) {
        conditions.push(sql`bathrooms >= ${filters.bathrooms}`);
      }
      if (filters.furnished !== undefined) {
        conditions.push(sql`furnished = ${filters.furnished}`);
      }
      if (filters.pets_allowed !== undefined) {
        conditions.push(sql`pets_allowed = ${filters.pets_allowed}`);
      }

      const whereClause = conditions.length > 0 
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

      const result = await sql`
        SELECT COUNT(*)::INTEGER as count
        FROM properties
        ${whereClause}
      `;
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Failed to count search results', error, filters);
      throw error;
    }
  }

  /**
   * Update property
   */
  async update(propertyId, updateData) {
    try {
      const result = await sql`
        UPDATE properties
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${propertyId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Property', propertyId);
      }
      
      logger.debug('Property updated in database', { propertyId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update property', error, { propertyId });
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViews(propertyId) {
    try {
      await sql`
        UPDATE properties
        SET views_count = views_count + 1
        WHERE id = ${propertyId}
      `;
      
      logger.debug('Property views incremented', { propertyId });
      return true;
    } catch (error) {
      logger.error('Failed to increment property views', error, { propertyId });
      throw error;
    }
  }

  /**
   * Get property statistics
   */
  async getStatistics(propertyId) {
    try {
      const result = await sql`
        SELECT 
          p.views_count,
          COUNT(DISTINCT pv.id)::INTEGER as total_viewings,
          COUNT(DISTINCT CASE WHEN pv.status = 'scheduled' THEN pv.id END)::INTEGER as scheduled_viewings,
          COUNT(DISTINCT CASE WHEN pv.status = 'completed' THEN pv.id END)::INTEGER as completed_viewings
        FROM properties p
        LEFT JOIN property_viewings pv ON p.id = pv.property_id
        WHERE p.id = ${propertyId}
        GROUP BY p.id, p.views_count
      `;
      
      return result[0] || {
        views_count: 0,
        total_viewings: 0,
        scheduled_viewings: 0,
        completed_viewings: 0
      };
    } catch (error) {
      logger.error('Failed to get property statistics', error, { propertyId });
      throw error;
    }
  }

  /**
   * Delete property
   */
  async delete(propertyId) {
    try {
      await sql`
        DELETE FROM properties
        WHERE id = ${propertyId}
      `;
      
      logger.debug('Property deleted from database', { propertyId });
      return true;
    } catch (error) {
      logger.error('Failed to delete property', error, { propertyId });
      throw error;
    }
  }
}

module.exports = new PropertyRepository();
