const { landlordService, propertyService, viewingService } = require('../services/landlords');
const { uploadService } = require('../services');
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendNotFound 
} = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// ============= LANDLORD PROFILE =============

const createLandlordProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profileData = req.body;

  const profile = await landlordService.createOrUpdateProfile(userId, profileData);
  return sendSuccess(res, 'Landlord profile saved', { profile });
});

const getLandlordProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await landlordService.getProfile(userId);
  return sendSuccess(res, 'Landlord profile retrieved', { profile });
});

const getPublicLandlordProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await landlordService.getPublicProfile(id);
  return sendSuccess(res, 'Landlord profile retrieved', { profile });
});

// ============= PROPERTIES =============

const createProperty = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const propertyData = req.body;

  const property = await propertyService.createProperty(userId, propertyData);
  return sendCreated(res, 'Property created', { property });
});

const uploadPropertyImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!req.files || req.files.length === 0) {
    return sendError(res, 'No images provided', 400);
  }

  const uploadedImages = await uploadService.uploadMultipleImages(req.files, 'properties');
  const property = await propertyService.addImages(id, userId, uploadedImages);

  return sendSuccess(res, 'Property images uploaded', { property });
});

const getProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await propertyService.getPropertyById(id);
  return sendSuccess(res, 'Property retrieved', { property });
});

const getUserProperties = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await propertyService.getUserProperties(userId, {
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return sendSuccess(res, 'Properties retrieved', result);
});

const browseProperties = asyncHandler(async (req, res) => {
  const filters = req.query;

  const result = await propertyService.browseProperties(filters);
  return sendSuccess(res, 'Properties retrieved', result);
});

const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  const property = await propertyService.updateProperty(id, userId, updateData);
  return sendSuccess(res, 'Property updated', { property });
});

const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await propertyService.deleteProperty(id, userId);
  return sendSuccess(res, 'Property deleted');
});

const deletePropertyImage = asyncHandler(async (req, res) => {
  const { propertyId, imageUrl } = req.params;
  const userId = req.user.id;

  await uploadService.deleteImage(imageUrl);
  const property = await propertyService.removeImage(propertyId, userId, imageUrl);

  return sendSuccess(res, 'Property image deleted', { property });
});

// ============= VIEWINGS =============

const scheduleViewing = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { property_id, viewing_date, notes } = req.body;

  const viewing = await viewingService.scheduleViewing(userId, {
    property_id,
    viewing_date,
    notes
  });

  return sendCreated(res, 'Viewing scheduled', { viewing });
});

const getPropertyViewings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status } = req.query;

  const viewings = await viewingService.getPropertyViewings(id, userId, status);
  return sendSuccess(res, 'Viewings retrieved', { viewings });
});

const getUserViewings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const viewings = await viewingService.getUserViewings(userId, status);
  return sendSuccess(res, 'Viewings retrieved', { viewings });
});

const updateViewingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status, landlord_notes } = req.body;

  const viewing = await viewingService.updateViewingStatus(id, userId, {
    status,
    landlord_notes
  });

  return sendSuccess(res, 'Viewing status updated', { viewing });
});

const cancelViewing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await viewingService.cancelViewing(id, userId);
  return sendSuccess(res, 'Viewing cancelled');
});

const getViewingDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const viewing = await viewingService.getViewingDetails(id, userId);
  return sendSuccess(res, 'Viewing details retrieved', { viewing });
});

module.exports = {
  // Landlord Profile
  createLandlordProfile,
  getLandlordProfile,
  getPublicLandlordProfile,
  
  // Properties
  createProperty,
  uploadPropertyImages,
  getProperty,
  getUserProperties,
  browseProperties,
  updateProperty,
  deleteProperty,
  deletePropertyImage,
  
  // Viewings
  scheduleViewing,
  getPropertyViewings,
  getUserViewings,
  updateViewingStatus,
  cancelViewing,
  getViewingDetails
};
