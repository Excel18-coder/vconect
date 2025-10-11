/**
 * Image Service
 * Handles image upload and deletion from Cloudinary
 */

const { cloudinary } = require('../../config/cloudinary');
const logger = require('../../utils/logger');
const { ValidationError } = require('../../errors');

class ImageService {
  /**
   * Upload multiple product images to Cloudinary
   */
  async uploadProductImages(files, userId) {
    try {
      if (!files || files.length === 0) {
        return [];
      }

      if (files.length > 8) {
        throw new ValidationError('Maximum 8 images allowed per product');
      }

      logger.info('Uploading product images', { count: files.length, userId });

      const uploadPromises = files.map((file, index) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `v-market/products/${userId}`,
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) {
                logger.error(`Failed to upload image ${index}`, error);
                reject(error);
              } else {
                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                  width: result.width,
                  height: result.height
                });
              }
            }
          );

          stream.end(file.buffer);
        });
      });

      const uploadedImages = await Promise.all(uploadPromises);
      
      logger.success('Product images uploaded successfully', { 
        count: uploadedImages.length, 
        userId 
      });

      return uploadedImages;
    } catch (error) {
      logger.error('Failed to upload product images', error, { userId });
      throw error;
    }
  }

  /**
   * Delete images from Cloudinary
   */
  async deleteProductImages(imageUrls) {
    try {
      if (!imageUrls || imageUrls.length === 0) {
        return;
      }

      logger.info('Deleting product images', { count: imageUrls.length });

      const deletePromises = imageUrls.map(async (image) => {
        try {
          const publicId = image.publicId || this.extractPublicId(image.url);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (error) {
          logger.warn('Failed to delete image', { publicId: image.publicId, error: error.message });
          // Don't throw - continue deleting other images
        }
      });

      await Promise.allSettled(deletePromises);
      
      logger.success('Product images deletion completed', { count: imageUrls.length });
    } catch (error) {
      logger.error('Failed to delete product images', error);
      // Don't throw - image deletion is not critical
    }
  }

  /**
   * Extract Cloudinary public ID from URL
   */
  extractPublicId(url) {
    try {
      if (!url) return null;
      
      const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
      return matches ? matches[1] : null;
    } catch (error) {
      logger.warn('Failed to extract public ID from URL', { url });
      return null;
    }
  }

  /**
   * Upload single profile image
   */
  async uploadProfileImage(file, userId) {
    try {
      if (!file) {
        throw new ValidationError('No image file provided');
      }

      logger.info('Uploading profile image', { userId });

      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `v-market/profiles/${userId}`,
            resource_type: 'image',
            transformation: [
              { width: 500, height: 500, crop: 'fill', gravity: 'face' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              logger.error('Failed to upload profile image', error);
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id
              });
            }
          }
        );

        stream.end(file.buffer);
      });
    } catch (error) {
      logger.error('Failed to upload profile image', error, { userId });
      throw error;
    }
  }

  /**
   * Delete single image by public ID
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) return;
      
      await cloudinary.uploader.destroy(publicId);
      logger.debug('Image deleted successfully', { publicId });
    } catch (error) {
      logger.warn('Failed to delete image', { publicId, error: error.message });
      // Don't throw - image deletion is not critical
    }
  }
}

module.exports = new ImageService();
