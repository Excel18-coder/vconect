/**
 * Property Service
 * Handles all property listing business logic
 */

const propertyRepository = require('../../repositories/propertyRepository');
const landlordRepository = require('../../repositories/landlordRepository');
const imageService = require('../products/imageService');
const logger = require('../../utils/logger');
const { NotFoundError, ValidationError, AuthorizationError } = require('../../errors');

class PropertyService {
  /**
   * Create property listing
   */
  async createProperty(landlordId, propertyData, files = []) {
    logger.debug('Creating property', { landlordId });

    const {
      title, description, property_type, listing_type,
      address, city, location, coordinates, price, currency = 'KES',
      bedrooms, bathrooms, area_sqft, floor_number, total_floors,
      parking_spaces, furnished, pets_allowed, amenities, utilities_included,
      video_tour_url, virtual_tour_url, available_from,
      lease_duration, deposit_amount, tags
    } = propertyData;

    // Validate required fields
    if (!title || !description || !property_type || !listing_type || !price) {
      throw new ValidationError('title, description, property_type, listing_type, and price are required');
    }

    // Verify landlord profile exists
    const landlordProfile = await landlordRepository.findByUserId(landlordId);
    if (!landlordProfile) {
      throw new ValidationError('Landlord profile must be created before listing properties');
    }

    // Handle image uploads
    let imageUrls = [];
    if (files && files.length > 0) {
      try {
        const uploadPromises = files.map(file => 
          imageService.uploadImage(file, 'properties')
        );
        imageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        logger.error('Failed to upload property images', error);
        throw new ValidationError('Failed to upload images');
      }
    }

    // Create property
    const property = await propertyRepository.create({
      landlord_id: landlordId,
      title: title.trim(),
      description: description.trim(),
      property_type,
      listing_type,
      address: address?.trim(),
      city: city?.trim(),
      location: location?.trim(),
      coordinates,
      price: parseFloat(price),
      currency,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area_sqft: area_sqft ? parseFloat(area_sqft) : null,
      floor_number: floor_number ? parseInt(floor_number) : null,
      total_floors: total_floors ? parseInt(total_floors) : null,
      parking_spaces: parking_spaces ? parseInt(parking_spaces) : null,
      furnished: furnished === true || furnished === 'true',
      pets_allowed: pets_allowed === true || pets_allowed === 'true',
      amenities,
      utilities_included,
      images: imageUrls,
      video_tour_url,
      virtual_tour_url,
      available_from,
      lease_duration,
      deposit_amount: deposit_amount ? parseFloat(deposit_amount) : null,
      tags,
      status: 'available'
    });

    // Update landlord's property count
    await landlordRepository.incrementPropertyCount(landlordId);

    logger.info('Property created', { landlordId, propertyId: property.id });

    return property;
  }

  /**
   * Get landlord's properties
   */
  async getLandlordProperties(landlordId, filters = {}) {
    logger.debug('Getting landlord properties', { landlordId, filters });

    const { status = 'all', limit = 20, offset = 0 } = filters;

    const properties = await propertyRepository.findByLandlordId(landlordId, {
      status: status === 'all' ? undefined : status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return properties;
  }

  /**
   * Browse properties (public)
   */
  async browseProperties(searchParams) {
    logger.debug('Browsing properties', searchParams);

    const {
      property_type, listing_type, city, location,
      min_price, max_price, bedrooms, bathrooms,
      furnished, pets_allowed, page = 1, limit = 20
    } = searchParams;

    const filters = {
      property_type,
      listing_type,
      city,
      location,
      min_price: min_price ? parseFloat(min_price) : undefined,
      max_price: max_price ? parseFloat(max_price) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
      furnished: furnished !== undefined ? furnished === 'true' : undefined,
      pets_allowed: pets_allowed !== undefined ? pets_allowed === 'true' : undefined,
      status: 'available',
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const properties = await propertyRepository.search(filters);
    const totalCount = await propertyRepository.countSearch(filters);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      properties,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get single property with details
   */
  async getProperty(propertyId, incrementView = true) {
    logger.debug('Getting property', { propertyId });

    const property = await propertyRepository.findByIdWithDetails(propertyId);

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Increment view count
    if (incrementView) {
      await propertyRepository.incrementViews(propertyId);
    }

    return property;
  }

  /**
   * Update property
   */
  async updateProperty(propertyId, landlordId, updateData) {
    logger.debug('Updating property', { propertyId, landlordId });

    // Verify ownership
    const property = await propertyRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    if (property.landlord_id !== landlordId) {
      throw new AuthorizationError('Not authorized to update this property');
    }

    const allowedFields = [
      'title', 'description', 'price', 'status', 'available_from',
      'bedrooms', 'bathrooms', 'furnished', 'pets_allowed',
      'amenities', 'utilities_included', 'deposit_amount'
    ];

    const updates = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (['price', 'deposit_amount'].includes(key)) {
          updates[key] = parseFloat(value);
        } else if (['bedrooms', 'bathrooms'].includes(key)) {
          updates[key] = parseInt(value);
        } else if (['furnished', 'pets_allowed'].includes(key)) {
          updates[key] = value === true || value === 'true';
        } else {
          updates[key] = typeof value === 'string' ? value.trim() : value;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const updatedProperty = await propertyRepository.update(propertyId, updates);

    logger.info('Property updated', { propertyId, landlordId });

    return updatedProperty;
  }

  /**
   * Delete property (soft delete)
   */
  async deleteProperty(propertyId, landlordId) {
    logger.debug('Deleting property', { propertyId, landlordId });

    // Verify ownership
    const property = await propertyRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    if (property.landlord_id !== landlordId) {
      throw new AuthorizationError('Not authorized to delete this property');
    }

    // Soft delete by setting status to inactive
    await propertyRepository.update(propertyId, { status: 'inactive' });

    // Decrement landlord's property count
    await landlordRepository.decrementPropertyCount(landlordId);

    logger.info('Property deleted', { propertyId, landlordId });

    return { message: 'Property deleted successfully' };
  }

  /**
   * Get property statistics
   */
  async getPropertyStats(propertyId, landlordId) {
    logger.debug('Getting property statistics', { propertyId });

    // Verify ownership
    const property = await propertyRepository.findById(propertyId);

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    if (property.landlord_id !== landlordId) {
      throw new AuthorizationError('Not authorized to view property statistics');
    }

    const stats = await propertyRepository.getStatistics(propertyId);

    return stats;
  }
}

module.exports = new PropertyService();
