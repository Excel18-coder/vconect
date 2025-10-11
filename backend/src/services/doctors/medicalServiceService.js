/**
 * Medical Service Service
 * Business logic for medical services management
 */

const medicalServiceRepository = require('../../repositories/medicalServiceRepository');
const doctorRepository = require('../../repositories/doctorRepository');
const logger = require('../../utils/logger');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../errors');

class MedicalServiceService {
  /**
   * Create medical service
   */
  async createService(doctorId, serviceData) {
    logger.debug('Creating medical service', { doctorId });

    // Validate required fields
    if (!serviceData.service_name || serviceData.service_name.trim().length === 0) {
      throw new ValidationError('Service name is required');
    }
    if (!serviceData.duration_minutes || serviceData.duration_minutes <= 0) {
      throw new ValidationError('Valid duration is required');
    }
    if (!serviceData.price || serviceData.price < 0) {
      throw new ValidationError('Valid price is required');
    }

    // Validate service type
    const validTypes = ['consultation', 'procedure', 'diagnostic', 'therapy', 'checkup'];
    if (!serviceData.service_type || !validTypes.includes(serviceData.service_type)) {
      throw new ValidationError(`Service type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate mode
    const validModes = ['online', 'in-person', 'both'];
    if (!serviceData.mode || !validModes.includes(serviceData.mode)) {
      throw new ValidationError(`Mode must be one of: ${validModes.join(', ')}`);
    }

    // Verify doctor profile exists
    const doctor = await doctorRepository.findByUserId(doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found. Please create your doctor profile first.');
    }

    try {
      const service = await medicalServiceRepository.create({
        doctor_id: doctorId,
        service_name: serviceData.service_name,
        description: serviceData.description || null,
        duration_minutes: serviceData.duration_minutes,
        price: serviceData.price,
        currency: serviceData.currency || 'KES',
        service_type: serviceData.service_type,
        mode: serviceData.mode,
        status: 'active'
      });

      logger.info('Medical service created', { serviceId: service.id, doctorId });
      return service;
    } catch (error) {
      logger.error('Failed to create medical service', error, { doctorId });
      throw error;
    }
  }

  /**
   * Get doctor's services
   */
  async getDoctorServices(doctorId, filters = {}) {
    logger.debug('Getting doctor services', { doctorId });

    try {
      const services = await medicalServiceRepository.findByDoctorId(doctorId, filters);
      return services;
    } catch (error) {
      logger.error('Failed to get doctor services', error, { doctorId });
      throw error;
    }
  }

  /**
   * Browse medical services
   */
  async browseServices(filters = {}) {
    logger.debug('Browsing medical services', filters);

    try {
      const searchFilters = {
        status: 'active',
        service_type: filters.service_type || null,
        mode: filters.mode || null,
        limit: parseInt(filters.limit) || 20,
        offset: filters.page ? (parseInt(filters.page) - 1) * (parseInt(filters.limit) || 20) : 0
      };

      const services = await medicalServiceRepository.search(searchFilters);
      const total = await medicalServiceRepository.countSearch(searchFilters);

      return {
        services,
        total,
        page: filters.page ? parseInt(filters.page) : 1,
        limit: searchFilters.limit,
        pages: Math.ceil(total / searchFilters.limit)
      };
    } catch (error) {
      logger.error('Failed to browse medical services', error, filters);
      throw error;
    }
  }

  /**
   * Get service by ID
   */
  async getService(serviceId) {
    logger.debug('Getting medical service', { serviceId });

    try {
      const service = await medicalServiceRepository.findByIdWithDetails(serviceId);
      
      if (!service) {
        throw new NotFoundError('Medical service', serviceId);
      }

      return service;
    } catch (error) {
      logger.error('Failed to get medical service', error, { serviceId });
      throw error;
    }
  }

  /**
   * Update service
   */
  async updateService(serviceId, userId, updateData) {
    logger.debug('Updating medical service', { serviceId, userId });

    try {
      // Get service and verify ownership
      const service = await medicalServiceRepository.findById(serviceId);
      if (!service) {
        throw new NotFoundError('Medical service', serviceId);
      }

      if (service.doctor_id !== userId) {
        throw new AuthorizationError('You can only update your own services');
      }

      // Validate status if being updated
      if (updateData.status) {
        const validStatuses = ['active', 'inactive'];
        if (!validStatuses.includes(updateData.status)) {
          throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
        }
      }

      const updated = await medicalServiceRepository.update(serviceId, updateData);
      logger.info('Medical service updated', { serviceId, userId });

      return updated;
    } catch (error) {
      logger.error('Failed to update medical service', error, { serviceId, userId });
      throw error;
    }
  }

  /**
   * Delete service
   */
  async deleteService(serviceId, userId) {
    logger.debug('Deleting medical service', { serviceId, userId });

    try {
      // Get service and verify ownership
      const service = await medicalServiceRepository.findById(serviceId);
      if (!service) {
        throw new NotFoundError('Medical service', serviceId);
      }

      if (service.doctor_id !== userId) {
        throw new AuthorizationError('You can only delete your own services');
      }

      // Soft delete by setting status to inactive
      await medicalServiceRepository.update(serviceId, { status: 'inactive' });
      logger.info('Medical service soft deleted', { serviceId, userId });

      return true;
    } catch (error) {
      logger.error('Failed to delete medical service', error, { serviceId, userId });
      throw error;
    }
  }
}

module.exports = new MedicalServiceService();
