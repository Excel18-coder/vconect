const multer = require('multer');
const { uploadService } = require('../services');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/error-handler');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10, // Maximum 10 files per request
  },
});

/**
 * Upload single image
 */
const uploadSingleImage = [
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, 'No image file provided', 400);
    }

    const folder = req.body.folder || 'general';
    const result = await uploadService.uploadImage(req.file, folder);

    return sendSuccess(res, 'Image uploaded successfully', result);
  }),
];

/**
 * Upload multiple images
 */
const uploadMultipleImages = [
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No image files provided', 400);
    }

    const folder = req.body.folder || 'general';
    const results = await uploadService.uploadMultipleImages(req.files, folder);

    return sendSuccess(res, 'Images uploaded successfully', { images: results });
  }),
];

/**
 * Upload avatar
 */
const uploadAvatar = [
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, 'No avatar file provided', 400);
    }

    const result = await uploadService.uploadImage(req.file, 'avatars');

    return sendSuccess(res, 'Avatar uploaded successfully', result);
  }),
];

/**
 * Upload product images
 */
const uploadProductImages = [
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No product images provided', 400);
    }

    const results = await uploadService.uploadMultipleImages(req.files, 'products');

    return sendSuccess(res, 'Product images uploaded successfully', { images: results });
  }),
];

/**
 * Upload document (PDF, DOC, DOCX)
 */
const uploadDocument = [
  upload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, 'No document file provided', 400);
    }

    const folder = req.body.folder || 'documents';
    const result = await uploadService.uploadDocument(req.file, folder);

    return sendSuccess(res, 'Document uploaded successfully', result);
  }),
];

/**
 * Upload multiple documents
 */
const uploadMultipleDocuments = [
  upload.array('documents', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No document files provided', 400);
    }

    const folder = req.body.folder || 'documents';
    const results = await uploadService.uploadMultipleDocuments(req.files, folder);

    return sendSuccess(res, 'Documents uploaded successfully', { documents: results });
  }),
];

/**
 * Delete image by URL
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return sendError(res, 'Image URL is required', 400);
  }

  await uploadService.deleteImage(imageUrl);

  return sendSuccess(res, 'Image deleted successfully');
});

/**
 * Delete multiple images
 */
const deleteMultipleImages = asyncHandler(async (req, res) => {
  const { imageUrls } = req.body;

  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return sendError(res, 'Image URLs array is required', 400);
  }

  const results = await uploadService.deleteMultipleImages(imageUrls);

  return sendSuccess(res, 'Images deleted successfully', results);
});

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadAvatar,
  uploadProductImages,
  uploadDocument,
  uploadMultipleDocuments,
  deleteImage,
  deleteMultipleImages,
};
