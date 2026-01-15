/**
 * Product DTOs (Data Transfer Objects)
 * Transform database models to API responses
 */

/**
 * Product DTO - Transform product for API response
 * @param {Object} product - Product object from database
 * @returns {Object} Transformed product object
 */
const toProductDto = (product) => {
  if (!product) return null;

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: parseFloat(product.price),
    category: product.category,
    subcategory: product.subcategory,
    condition: product.condition,
    location: product.location,
    stockQuantity: product.stock_quantity || product.stockQuantity,
    discountPercentage: product.discount_percentage || product.discountPercentage,
    weight: product.weight,
    shippingCost: parseFloat(product.shipping_cost || product.shippingCost || 0),
    views: parseInt(product.views || 0),
    status: product.status,
    tags: product.tags || [],
    images: product.images || [],
    seller: product.seller ? {
      id: product.seller.id || product.seller_id,
      displayName: product.seller.display_name || product.seller.displayName || product.seller_name,
      email: product.seller.email || product.seller_email,
      avatarUrl: product.seller.avatar_url || product.seller.avatarUrl,
      location: product.seller.location || product.seller_location,
      phoneNumber: product.seller.phone_number || product.seller.phoneNumber
    } : null,
    createdAt: product.created_at || product.createdAt,
    updatedAt: product.updated_at || product.updatedAt
  };
};

/**
 * Product list DTO - Transform array of products
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of transformed product objects
 */
const toProductList = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map(toProductDto);
};

/**
 * Product summary DTO - Minimal product info for lists/cards
 * @param {Object} product - Product object from database
 * @returns {Object} Minimal product object
 */
const toProductSummary = (product) => {
  if (!product) return null;

  return {
    id: product.id,
    title: product.title,
    price: parseFloat(product.price),
    category: product.category,
    condition: product.condition,
    location: product.location,
    discountPercentage: product.discount_percentage || product.discountPercentage,
    status: product.status,
    images: product.images?.[0] ? [product.images[0]] : [],
    mainImage: product.images?.[0]?.url || product.images?.[0],
    views: parseInt(product.views || 0),
    seller: {
      id: product.seller?.id || product.seller_id,
      displayName: product.seller?.display_name || product.seller?.displayName || product.seller_name
    },
    createdAt: product.created_at || product.createdAt
  };
};

/**
 * Product detail DTO - Full product info with seller details
 * @param {Object} product - Product object from database
 * @param {Object} seller - Seller object from database
 * @returns {Object} Detailed product object
 */
const toProductDetail = (product, seller = null) => {
  const productDto = toProductDto(product);
  
  if (seller && !productDto.seller) {
    productDto.seller = {
      id: seller.id,
      displayName: seller.display_name || seller.displayName,
      email: seller.email,
      avatarUrl: seller.avatar_url || seller.avatarUrl,
      location: seller.location,
      phoneNumber: seller.phone_number || seller.phoneNumber
    };
  }

  return productDto;
};

module.exports = {
  toProductDto,
  toProductList,
  toProductSummary,
  toProductDetail
};
