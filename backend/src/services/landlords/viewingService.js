/**
 * Viewing Service
 * Handles all property viewing appointment business logic
 */

const viewingRepository = require('../../repositories/viewingRepository');
const propertyRepository = require('../../repositories/propertyRepository');
const notificationService = require('../buyers/notificationService');
const logger = require('../../utils/logger');
const { NotFoundError, ValidationError, AuthorizationError, ConflictError } = require('../../errors');

class ViewingService {
  /**
   * Schedule property viewing
   */
  async scheduleViewing(tenantId, viewingData) {
    logger.debug('Scheduling viewing', { tenantId });

    const { property_id, viewing_date, viewing_time, notes } = viewingData;

    if (!property_id || !viewing_date || !viewing_time) {
      throw new ValidationError('property_id, viewing_date, and viewing_time are required');
    }

    // Verify property exists and is available
    const property = await propertyRepository.findById(property_id);

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    if (property.status !== 'available') {
      throw new ValidationError('Property is not available for viewing');
    }

    // Check if viewing time is in the future
    const viewingDateTime = new Date(`${viewing_date}T${viewing_time}`);
    if (viewingDateTime <= new Date()) {
      throw new ValidationError('Viewing date/time must be in the future');
    }

    // Check for conflicting viewings
    const conflicts = await viewingRepository.findConflicts(
      property_id,
      viewing_date,
      viewing_time
    );

    if (conflicts.length > 0) {
      throw new ConflictError('This viewing slot is already booked');
    }

    // Create viewing
    const viewing = await viewingRepository.create({
      property_id,
      landlord_id: property.landlord_id,
      tenant_id: tenantId,
      viewing_date,
      viewing_time,
      notes: notes?.trim() || null,
      status: 'scheduled'
    });

    // Notify landlord
    try {
      await notificationService.createNotification({
        user_id: property.landlord_id,
        type: 'viewing',
        title: 'New Viewing Request',
        message: `New viewing scheduled for ${property.title} on ${viewing_date} at ${viewing_time}`,
        action_url: `/landlord/viewings/${viewing.id}`,
        related_id: viewing.id,
        related_type: 'viewing'
      });
    } catch (error) {
      logger.error('Failed to send viewing notification', error);
    }

    logger.info('Viewing scheduled', { tenantId, viewingId: viewing.id });

    return viewing;
  }

  /**
   * Get landlord's viewings
   */
  async getLandlordViewings(landlordId, filters = {}) {
    logger.debug('Getting landlord viewings', { landlordId });

    const { status, date, limit = 50, offset = 0 } = filters;

    const viewings = await viewingRepository.findByLandlordId(landlordId, {
      status,
      date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return viewings;
  }

  /**
   * Get tenant's viewings
   */
  async getTenantViewings(tenantId, filters = {}) {
    logger.debug('Getting tenant viewings', { tenantId });

    const { status, date, limit = 50, offset = 0 } = filters;

    const viewings = await viewingRepository.findByTenantId(tenantId, {
      status,
      date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return viewings;
  }

  /**
   * Get viewing by ID
   */
  async getViewing(viewingId, userId) {
    logger.debug('Getting viewing', { viewingId, userId });

    const viewing = await viewingRepository.findByIdWithDetails(viewingId);

    if (!viewing) {
      throw new NotFoundError('Viewing not found');
    }

    // Verify user is landlord or tenant
    if (viewing.landlord_id !== userId && viewing.tenant_id !== userId) {
      throw new AuthorizationError('Not authorized to view this viewing');
    }

    return viewing;
  }

  /**
   * Update viewing status (landlord only)
   */
  async updateViewingStatus(viewingId, landlordId, updateData) {
    logger.debug('Updating viewing status', { viewingId, landlordId });

    const { status, feedback } = updateData;

    if (!status) {
      throw new ValidationError('status is required');
    }

    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`status must be one of: ${validStatuses.join(', ')}`);
    }

    // Verify viewing exists and landlord owns it
    const viewing = await viewingRepository.findById(viewingId);

    if (!viewing) {
      throw new NotFoundError('Viewing not found');
    }

    if (viewing.landlord_id !== landlordId) {
      throw new AuthorizationError('Not authorized to update this viewing');
    }

    // Update viewing
    const updatedViewing = await viewingRepository.update(viewingId, {
      status,
      feedback: feedback?.trim() || viewing.feedback
    });

    // Notify tenant of status change
    try {
      await notificationService.createNotification({
        user_id: viewing.tenant_id,
        type: 'viewing',
        title: 'Viewing Status Updated',
        message: `Your viewing has been ${status}${feedback ? ': ' + feedback : ''}`,
        action_url: `/viewings/${viewingId}`,
        related_id: viewingId,
        related_type: 'viewing'
      });
    } catch (error) {
      logger.error('Failed to send viewing update notification', error);
    }

    logger.info('Viewing status updated', { viewingId, landlordId, status });

    return updatedViewing;
  }

  /**
   * Cancel viewing (tenant or landlord)
   */
  async cancelViewing(viewingId, userId, reason = null) {
    logger.debug('Cancelling viewing', { viewingId, userId });

    const viewing = await viewingRepository.findById(viewingId);

    if (!viewing) {
      throw new NotFoundError('Viewing not found');
    }

    // Verify user is landlord or tenant
    if (viewing.landlord_id !== userId && viewing.tenant_id !== userId) {
      throw new AuthorizationError('Not authorized to cancel this viewing');
    }

    // Can't cancel completed viewings
    if (viewing.status === 'completed') {
      throw new ValidationError('Cannot cancel completed viewings');
    }

    // Update to cancelled
    const updatedViewing = await viewingRepository.update(viewingId, {
      status: 'cancelled',
      feedback: reason?.trim() || 'Cancelled by user'
    });

    // Notify the other party
    const notifyUserId = userId === viewing.landlord_id 
      ? viewing.tenant_id 
      : viewing.landlord_id;

    try {
      await notificationService.createNotification({
        user_id: notifyUserId,
        type: 'viewing',
        title: 'Viewing Cancelled',
        message: `A viewing has been cancelled${reason ? ': ' + reason : ''}`,
        action_url: `/viewings/${viewingId}`,
        related_id: viewingId,
        related_type: 'viewing'
      });
    } catch (error) {
      logger.error('Failed to send cancellation notification', error);
    }

    logger.info('Viewing cancelled', { viewingId, userId });

    return updatedViewing;
  }

  /**
   * Reschedule viewing
   */
  async rescheduleViewing(viewingId, userId, newDate, newTime, reason = null) {
    logger.debug('Rescheduling viewing', { viewingId, userId });

    const viewing = await viewingRepository.findById(viewingId);

    if (!viewing) {
      throw new NotFoundError('Viewing not found');
    }

    // Verify user is landlord or tenant
    if (viewing.landlord_id !== userId && viewing.tenant_id !== userId) {
      throw new AuthorizationError('Not authorized to reschedule this viewing');
    }

    // Validate new date/time is in future
    const newDateTime = new Date(`${newDate}T${newTime}`);
    if (newDateTime <= new Date()) {
      throw new ValidationError('New viewing date/time must be in the future');
    }

    // Check for conflicts
    const conflicts = await viewingRepository.findConflicts(
      viewing.property_id,
      newDate,
      newTime,
      viewingId // Exclude current viewing
    );

    if (conflicts.length > 0) {
      throw new ConflictError('The new viewing slot is already booked');
    }

    // Update viewing
    const updatedViewing = await viewingRepository.update(viewingId, {
      viewing_date: newDate,
      viewing_time: newTime,
      status: 'scheduled',
      feedback: reason?.trim() || 'Rescheduled'
    });

    // Notify the other party
    const notifyUserId = userId === viewing.landlord_id 
      ? viewing.tenant_id 
      : viewing.landlord_id;

    try {
      await notificationService.createNotification({
        user_id: notifyUserId,
        type: 'viewing',
        title: 'Viewing Rescheduled',
        message: `A viewing has been rescheduled to ${newDate} at ${newTime}`,
        action_url: `/viewings/${viewingId}`,
        related_id: viewingId,
        related_type: 'viewing'
      });
    } catch (error) {
      logger.error('Failed to send reschedule notification', error);
    }

    logger.info('Viewing rescheduled', { viewingId, userId });

    return updatedViewing;
  }
}

module.exports = new ViewingService();
