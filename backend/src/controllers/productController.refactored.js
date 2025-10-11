/**
 * Product Controller (Refactored)
 * Thin controller layer - only handles HTTP requests/responses
 * Business logic is in ProductService
 */

const productService = require('../services/products/productService');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Create a new product listing
 * POST /api/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const files = req.files;
  
  const product = await productService.createProduct(userId, req.body, files);
  
  return sendCreated(res, 'Product created successfully', product);
});

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const incrementView = req.query.view !== 'false'; // Increment view by default
  
  const product = await productService.getProductById(id, incrementView);
  
  return sendSuccess(res, 'Product retrieved successfully', product);
});

/**
 * Get seller's own products
 * GET /api/products/seller/my-products
 */
const getSellerProducts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  
  const result = await productService.getSellerProducts(userId, page, limit);
  
  return sendSuccess(res, 'Products retrieved successfully', result);
});

/**
 * Browse all products (public)
 * GET /api/products/browse
 */
const browseProducts = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    category: req.query.category,
    search: req.query.search,
    min_price: req.query.min_price,
    max_price: req.query.max_price,
    condition: req.query.condition,
    location: req.query.location,
    sort: req.query.sort || 'created_at',
    order: req.query.order || 'DESC'
  };
  
  const result = await productService.browseProducts(filters);
  
  return sendSuccess(res, 'Products retrieved successfully', result);
});

/**
 * Update product
 * PUT /api/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const files = req.files;
  
  const product = await productService.updateProduct(id, userId, req.body, files);
  
  return sendSuccess(res, 'Product updated successfully', product);
});

/**
 * Delete product
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  await productService.deleteProduct(id, userId);
  
  return sendSuccess(res, 'Product deleted successfully');
});

module.exports = {
  createProduct,
  getProduct,
  getSellerProducts,
  browseProducts,
  updateProduct,
  deleteProduct
};
