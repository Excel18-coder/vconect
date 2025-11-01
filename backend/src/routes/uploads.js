const express = require('express');
const router = express.Router();
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/response');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Max 10 images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
    }
  }
});

/**
 * Upload images for any service provider
 * Works for: sellers, landlords, employers, doctors, tutors
 */
const uploadImages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  if (!req.files || req.files.length === 0) {
    return sendError(res, 'No images provided', null, 400);
  }

  try {
    // Determine folder based on user type
    const { folder = 'general' } = req.body;
    const cloudinaryFolder = `vmarket/${folder}`;

    // Upload each file to Cloudinary
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: cloudinaryFolder,
            resource_type: 'image',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
              { crop: 'limit', width: 2000, height: 2000 }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format
              });
            }
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    return sendSuccess(res, 'Images uploaded successfully', {
      images: uploadedImages,
      count: uploadedImages.length
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return sendError(res, 'Failed to upload images', error.message, 500);
  }
});

/**
 * Delete an image from Cloudinary
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;

  if (!publicId) {
    return sendError(res, 'Image public_id is required', null, 400);
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    return sendSuccess(res, 'Image deleted successfully');
  } catch (error) {
    console.error('Error deleting image:', error);
    return sendError(res, 'Failed to delete image', error.message, 500);
  }
});

// Routes
router.post('/images', authenticateToken, upload.array('images', 10), uploadImages);
router.delete('/images', authenticateToken, deleteImage);

module.exports = router;
