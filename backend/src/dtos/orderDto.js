/**
 * Order DTOs (Data Transfer Objects)
 * Transform order models to API responses
 */

/**
 * Order DTO - Transform order for API response
 * @param {Object} order - Order object from database
 * @returns {Object} Transformed order object
 */
const toOrderDto = (order) => {
  if (!order) return null;

  return {
    id: order.id,
    buyerId: order.buyer_id || order.buyerId,
    sellerId: order.seller_id || order.sellerId,
    productId: order.product_id || order.productId,
    quantity: order.quantity,
    totalPrice: parseFloat(order.total_price || order.totalPrice),
    shippingAddress: order.shipping_address || order.shippingAddress,
    status: order.status,
    paymentStatus: order.payment_status || order.paymentStatus,
    paymentMethod: order.payment_method || order.paymentMethod,
    notes: order.notes,
    createdAt: order.created_at || order.createdAt,
    updatedAt: order.updated_at || order.updatedAt
  };
};

/**
 * Order with details DTO - Transform order with product and user info
 * @param {Object} order - Order object from database
 * @param {Object} product - Product object
 * @param {Object} buyer - Buyer object
 * @param {Object} seller - Seller object
 * @returns {Object} Detailed order object
 */
const toOrderDetail = (order, product = null, buyer = null, seller = null) => {
  const orderDto = toOrderDto(order);

  if (product) {
    orderDto.product = {
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      images: product.images || []
    };
  }

  if (buyer) {
    orderDto.buyer = {
      id: buyer.id,
      displayName: buyer.display_name || buyer.displayName,
      email: buyer.email
    };
  }

  if (seller) {
    orderDto.seller = {
      id: seller.id,
      displayName: seller.display_name || seller.displayName,
      email: seller.email
    };
  }

  return orderDto;
};

/**
 * Order list DTO - Transform array of orders
 * @param {Array} orders - Array of order objects
 * @returns {Array} Array of transformed order objects
 */
const toOrderList = (orders) => {
  if (!Array.isArray(orders)) return [];
  return orders.map(toOrderDto);
};

module.exports = {
  toOrderDto,
  toOrderDetail,
  toOrderList
};
