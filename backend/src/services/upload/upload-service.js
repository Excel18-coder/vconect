/**
 * Upload Service
 * Business logic for file uploads management
 */

const { cloudinary } = require('../../config/cloudinary');
const logger = require('../../utils/logger');
const { ValidationError } = require('../../errors');

class UploadService {
  /**
   * Upload single image
   */
  async uploadImage(file, folder = 'vmarket') {
    logger.debug('Uploading single image', { folder });

    if (!file || !file.buffer) {
      throw new ValidationError('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('Only image files (JPEG, PNG, WebP, GIF) are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ValidationError('File size must be less than 5MB');
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `vmarket/${folder}`,
            resource_type: 'image',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      logger.info('Image uploaded successfully', { url: result.secure_url });
      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      };
    } catch (error) {
      logger.error('Failed to upload image', error);
      throw new Error('Image upload failed');
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(files, folder = 'vmarket') {
    logger.debug('Uploading multiple images', { count: files.length, folder });

    if (!files || files.length === 0) {
      throw new ValidationError('No files provided');
    }

    // Validate max files
    if (files.length > 10) {
      throw new ValidationError('Maximum 10 files can be uploaded at once');
    }

    try {
      const uploadPromises = files.map(file => this.uploadImage(file, folder));
      const results = await Promise.all(uploadPromises);

      logger.info('Multiple images uploaded successfully', { count: results.length });
      return results;
    } catch (error) {
      logger.error('Failed to upload multiple images', error);
      throw error;
    }
  }

  /**
   * Upload document (PDF, DOC, etc.)
   */
  async uploadDocument(file, folder = 'documents') {
    logger.debug('Uploading document', { folder });

    if (!file || !file.buffer) {
      throw new ValidationError('No file provided');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('Only PDF, DOC, DOCX, XLS, XLSX, and TXT files are allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ValidationError('File size must be less than 10MB');
    }

    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `vmarket/${folder}`,
            resource_type: 'raw',
            use_filename: true,
            unique_filename: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      logger.info('Document uploaded successfully', { url: result.secure_url });
      return {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      logger.error('Failed to upload document', error);
      throw new Error('Document upload failed');
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId) {
    logger.debug('Deleting image', { publicId });

    if (!publicId) {
      throw new ValidationError('Public ID is required');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        logger.info('Image deleted successfully', { publicId });
        return true;
      } else {
        logger.warn('Image deletion failed', { publicId, result });
        return false;
      }
    } catch (error) {
      logger.error('Failed to delete image', error, { publicId });
      throw new Error('Image deletion failed');
    }
  }

  /**
   * Delete multiple images
   */
  async deleteImages(publicIds) {
    logger.debug('Deleting multiple images', { count: publicIds.length });

    if (!publicIds || publicIds.length === 0) {
      throw new ValidationError('No public IDs provided');
    }

    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      
      logger.info('Multiple images deleted', { 
        count: publicIds.length,
        deleted: Object.keys(result.deleted).length 
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to delete multiple images', error);
      throw new Error('Multiple image deletion failed');
    }
  }

  /**
   * Get image URL with transformations
   */
  getTransformedUrl(publicId, transformations = {}) {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto:good',
      format = 'auto'
    } = transformations;

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format
    });
  }
}

module.exports = new UploadService();
