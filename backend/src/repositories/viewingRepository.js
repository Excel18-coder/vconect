/**
 * Viewing Repository
 * Handles all database operations for property viewings
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../errors');

class ViewingRepository {
  /**
   * Create viewing
   */
  async create(viewingData) {
    try {
      const result = await sql`
        INSERT INTO property_viewings (
          property_id, tenant_id, scheduled_date, duration_minutes,
          notes, status
        )
        VALUES (
          ${viewingData.property_id}, ${viewingData.tenant_id}, 
          ${viewingData.scheduled_date}, ${viewingData.duration_minutes || 30},
          ${viewingData.notes || null}, ${viewingData.status || 'scheduled'}
        )
        RETURNING *
      `;
      
      logger.debug('Viewing created in database', { viewingId: result[0]?.id });
      return result[0];
    } catch (error) {
      logger.error('Failed to create viewing', error, viewingData);
      throw error;
    }
  }

  /**
   * Find viewing by ID
   */
  async findById(viewingId) {
    try {
      const result = await sql`
        SELECT * FROM property_viewings
        WHERE id = ${viewingId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find viewing', error, { viewingId });
      throw error;
    }
  }

  /**
   * Find viewing by ID with full details
   */
  async findByIdWithDetails(viewingId) {
    try {
      const result = await sql`
        SELECT 
          pv.*,
          p.title as property_title,
          p.address as property_address,
          p.city as property_city,
          p.landlord_id,
          tenant_prof.display_name as tenant_name,
          tenant_prof.phone_number as tenant_phone,
          u.email as tenant_email,
          landlord_prof.display_name as landlord_name,
          landlord_prof.phone_number as landlord_phone,
          lu.email as landlord_email
        FROM property_viewings pv
        JOIN properties p ON pv.property_id = p.id
        JOIN users u ON pv.tenant_id = u.id
        JOIN profiles tenant_prof ON pv.tenant_id = tenant_prof.user_id
        JOIN users lu ON p.landlord_id = lu.id
        JOIN profiles landlord_prof ON p.landlord_id = landlord_prof.user_id
        WHERE pv.id = ${viewingId}
        LIMIT 1
      `;
      
      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find viewing with details', error, { viewingId });
      throw error;
    }
  }

  /**
   * Find viewings by landlord
   */
  async findByLandlordId(landlordId, options = {}) {
    try {
      const { status, startDate, endDate, limit = 20, offset = 0 } = options;

      let conditions = [sql`p.landlord_id = ${landlordId}`];

      if (status) {
        conditions.push(sql`pv.status = ${status}`);
      }
      if (startDate) {
        conditions.push(sql`pv.scheduled_date >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql`pv.scheduled_date <= ${endDate}`);
      }

      const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

      const result = await sql`
        SELECT 
          pv.*,
          p.title as property_title,
          p.address as property_address,
          p.city as property_city,
          prof.display_name as tenant_name,
          prof.phone_number as tenant_phone,
          u.email as tenant_email
        FROM property_viewings pv
        JOIN properties p ON pv.property_id = p.id
        JOIN users u ON pv.tenant_id = u.id
        JOIN profiles prof ON pv.tenant_id = prof.user_id
        ${whereClause}
        ORDER BY pv.scheduled_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find viewings by landlord', error, { landlordId });
      throw error;
    }
  }

  /**
   * Find viewings by tenant
   */
  async findByTenantId(tenantId, options = {}) {
    try {
      const { status, startDate, endDate, limit = 20, offset = 0 } = options;

      let conditions = [sql`pv.tenant_id = ${tenantId}`];

      if (status) {
        conditions.push(sql`pv.status = ${status}`);
      }
      if (startDate) {
        conditions.push(sql`pv.scheduled_date >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql`pv.scheduled_date <= ${endDate}`);
      }

      const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`;

      const result = await sql`
        SELECT 
          pv.*,
          p.title as property_title,
          p.address as property_address,
          p.city as property_city,
          p.landlord_id,
          prof.display_name as landlord_name,
          prof.phone_number as landlord_phone,
          u.email as landlord_email
        FROM property_viewings pv
        JOIN properties p ON pv.property_id = p.id
        JOIN users u ON p.landlord_id = u.id
        JOIN profiles prof ON p.landlord_id = prof.user_id
        ${whereClause}
        ORDER BY pv.scheduled_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      return result;
    } catch (error) {
      logger.error('Failed to find viewings by tenant', error, { tenantId });
      throw error;
    }
  }

  /**
   * Find conflicting viewings
   */
  async findConflicts(propertyId, scheduledDate, durationMinutes = 30, excludeViewingId = null) {
    try {
      const endDate = new Date(scheduledDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);

      let query = sql`
        SELECT * FROM property_viewings
        WHERE property_id = ${propertyId}
        AND status IN ('scheduled', 'confirmed')
        AND (
          (scheduled_date <= ${scheduledDate} AND scheduled_date + (duration_minutes || ' minutes')::INTERVAL > ${scheduledDate})
          OR
          (scheduled_date < ${endDate.toISOString()} AND scheduled_date + (duration_minutes || ' minutes')::INTERVAL >= ${endDate.toISOString()})
          OR
          (scheduled_date >= ${scheduledDate} AND scheduled_date < ${endDate.toISOString()})
        )
      `;

      if (excludeViewingId) {
        query = sql`${query} AND id != ${excludeViewingId}`;
      }

      const result = await query;
      return result;
    } catch (error) {
      logger.error('Failed to find viewing conflicts', error, { propertyId, scheduledDate });
      throw error;
    }
  }

  /**
   * Update viewing
   */
  async update(viewingId, updateData) {
    try {
      const result = await sql`
        UPDATE property_viewings
        SET ${sql(updateData)}, updated_at = NOW()
        WHERE id = ${viewingId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new NotFoundError('Viewing', viewingId);
      }
      
      logger.debug('Viewing updated in database', { viewingId });
      return result[0];
    } catch (error) {
      logger.error('Failed to update viewing', error, { viewingId });
      throw error;
    }
  }

  /**
   * Delete viewing
   */
  async delete(viewingId) {
    try {
      await sql`
        DELETE FROM property_viewings
        WHERE id = ${viewingId}
      `;
      
      logger.debug('Viewing deleted from database', { viewingId });
      return true;
    } catch (error) {
      logger.error('Failed to delete viewing', error, { viewingId });
      throw error;
    }
  }
}

module.exports = new ViewingRepository();
