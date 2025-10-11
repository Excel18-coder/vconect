/**
 * Products Services Index
 * Barrel export for product-related services
 */

const productService = require('./productService');
const imageService = require('./imageService');

module.exports = {
  productService,
  imageService
};
