const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    logger.info('Cloudinary connected successfully');
    return true;
  } catch (error) {
    logger.error('Cloudinary connection failed', error);
    return false;
  }
};

module.exports = {
  cloudinary,
  testCloudinaryConnection
};
