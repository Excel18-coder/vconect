/**
 * Products Services Index
 * Barrel export for product-related services
 */

const productService = require('./product-service');
const imageService = require('./image-service');

module.exports = {
  productService,
  imageService,
};
