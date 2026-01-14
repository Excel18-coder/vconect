/**
 * Admin Controller
 * Handles all admin operations
 */

const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess, sendCreated } = require('../utils/response');
const { sql } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  logger.info('Fetching dashboard stats');

  // Get user stats
  const userStats = await sql`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN p.user_type = 'buyer' THEN 1 END) as buyers,
      COUNT(CASE WHEN p.user_type = 'seller' THEN 1 END) as sellers,
      COUNT(CASE WHEN p.user_type = 'landlord' THEN 1 END) as landlords,
      COUNT(CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
  `;

  // Get product stats
  const productStats = await sql`
    SELECT 
      COUNT(*) as total_products,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
      COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_products,
      COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_products,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_products_30d,
      SUM(views) as total_views
    FROM products
  `;

  // Get message stats
  const messageStats = await sql`
    SELECT 
      COUNT(*) as total_messages,
      COUNT(CASE WHEN read = false THEN 1 END) as unread_messages,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as messages_30d
    FROM messages
  `;

  // Get revenue by category (last 30 days)
  const categoryStats = await sql`
    SELECT 
      category,
      COUNT(*) as product_count,
      SUM(views) as total_views
    FROM products
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY category
    ORDER BY product_count DESC
  `;

  // Get recent activity
  const recentActivity = await sql`
    SELECT 
      'user_registered' as type,
      u.email as description,
      u.created_at as timestamp
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT 10
  `;

  return sendSuccess(res, 'Dashboard stats retrieved successfully', {
    users: userStats[0],
    products: productStats[0],
    messages: messageStats[0],
    categories: categoryStats,
    recentActivity,
  });
});

/**
 * Get all users with filters
 * GET /api/admin/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    userType = null,
    sortBy = 'created_at',
    order = 'DESC',
  } = req.query;

  const offset = (page - 1) * limit;

  let query = sql`
    SELECT 
      u.id, u.email, u.email_verified, u.created_at,
      p.display_name, p.user_type, p.location, p.phone_number, p.avatar_url,
      COUNT(DISTINCT pr.id) as product_count
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN products pr ON u.id = pr.seller_id
  `;

  // Add WHERE clause
  const conditions = [];
  if (search) {
    conditions.push(sql`(u.email ILIKE ${`%${search}%`} OR p.display_name ILIKE ${`%${search}%`})`);
  }
  if (userType) {
    conditions.push(sql`p.user_type = ${userType}`);
  }

  if (conditions.length > 0) {
    query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
  }

  query = sql`${query}
    GROUP BY u.id, u.email, u.email_verified, u.created_at,
             p.display_name, p.user_type, p.location, p.phone_number, p.avatar_url
    ORDER BY ${sql(sortBy)} ${sql.raw(order)}
    LIMIT ${limit} OFFSET ${offset}
  `;

  const users = await query;

  // Get total count
  let countQuery = sql`SELECT COUNT(DISTINCT u.id) as total FROM users u LEFT JOIN profiles p ON u.id = p.user_id`;
  if (conditions.length > 0) {
    countQuery = sql`${countQuery} WHERE ${sql.join(conditions, sql` AND `)}`;
  }
  const totalResult = await countQuery;
  const total = parseInt(totalResult[0].total);

  return sendSuccess(res, 'Users retrieved successfully', {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get all products with filters
 * GET /api/admin/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    category = null,
    status = null,
    sortBy = 'created_at',
    order = 'DESC',
  } = req.query;

  const offset = (page - 1) * limit;

  let query = sql`
    SELECT 
      p.*,
      pr.display_name as seller_name,
      pr.user_type as seller_type
    FROM products p
    LEFT JOIN profiles pr ON p.seller_id = pr.user_id
  `;

  const conditions = [];
  if (search) {
    conditions.push(sql`(p.title ILIKE ${`%${search}%`} OR p.description ILIKE ${`%${search}%`})`);
  }
  if (category) {
    conditions.push(sql`p.category = ${category}`);
  }
  if (status) {
    conditions.push(sql`p.status = ${status}`);
  }

  if (conditions.length > 0) {
    query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
  }

  query = sql`${query}
    ORDER BY ${sql(sortBy)} ${sql.raw(order)}
    LIMIT ${limit} OFFSET ${offset}
  `;

  const products = await query;

  // Get total count
  let countQuery = sql`SELECT COUNT(*) as total FROM products`;
  if (conditions.length > 0) {
    countQuery = sql`${countQuery} WHERE ${sql.join(conditions, sql` AND `)}`;
  }
  const totalResult = await countQuery;
  const total = parseInt(totalResult[0].total);

  return sendSuccess(res, 'Products retrieved successfully', {
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Update product status
 * PATCH /api/admin/products/:id/status
 */
const updateProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await sql`
    UPDATE products
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    throw new NotFoundError('Product not found');
  }

  logger.info('Product status updated', { productId: id, status, adminId: req.user.id });

  return sendSuccess(res, 'Product status updated successfully', result[0]);
});

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await sql`
    DELETE FROM products
    WHERE id = ${id}
    RETURNING id
  `;

  if (result.length === 0) {
    throw new NotFoundError('Product not found');
  }

  logger.info('Product deleted', { productId: id, adminId: req.user.id });

  return sendSuccess(res, 'Product deleted successfully');
});

/**
 * Update user role
 * PATCH /api/admin/users/:id/role
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userType } = req.body;

  const result = await sql`
    UPDATE profiles
    SET user_type = ${userType}, updated_at = NOW()
    WHERE user_id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    throw new NotFoundError('User not found');
  }

  logger.info('User role updated', { userId: id, userType, adminId: req.user.id });

  return sendSuccess(res, 'User role updated successfully', result[0]);
});

/**
 * Ban/suspend user
 * PATCH /api/admin/users/:id/suspend
 */
const suspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Update all user's products to inactive
  await sql`
    UPDATE products
    SET status = 'inactive'
    WHERE seller_id = ${id}
  `;

  // Mark user as suspended (you might want to add a suspended column)
  await sql`
    UPDATE users
    SET updated_at = NOW()
    WHERE id = ${id}
  `;

  logger.warn('User suspended', { userId: id, reason, adminId: req.user.id });

  return sendSuccess(res, 'User suspended successfully');
});

/**
 * Get system activity logs
 * GET /api/admin/activity
 */
const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  // Combine different activity types
  const activities = await sql`
    (
      SELECT 'user_registered' as type, email as description, created_at as timestamp
      FROM users
    )
    UNION ALL
    (
      SELECT 'product_created' as type, title as description, created_at as timestamp
      FROM products
    )
    UNION ALL
    (
      SELECT 'message_sent' as type, subject as description, created_at as timestamp
      FROM messages
    )
    ORDER BY timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return sendSuccess(res, 'Activity logs retrieved successfully', activities);
});

/**
 * Get all messages (admin monitoring)
 * GET /api/admin/messages
 */
const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, unreadOnly = false } = req.query;
  const offset = (page - 1) * limit;

  let query = sql`
    SELECT 
      m.*,
      sender.email as sender_email,
      sender_prof.display_name as sender_name,
      receiver.email as receiver_email,
      receiver_prof.display_name as receiver_name,
      p.title as product_title
    FROM messages m
    LEFT JOIN users sender ON m.sender_id = sender.id
    LEFT JOIN profiles sender_prof ON m.sender_id = sender_prof.user_id
    LEFT JOIN users receiver ON m.receiver_id = receiver.id
    LEFT JOIN profiles receiver_prof ON m.receiver_id = receiver_prof.user_id
    LEFT JOIN products p ON m.listing_id = p.id
  `;

  if (unreadOnly === 'true') {
    query = sql`${query} WHERE m.read = false`;
  }

  query = sql`${query}
    ORDER BY m.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const messages = await query;

  return sendSuccess(res, 'Messages retrieved successfully', messages);
});

/**
 * Delete message (admin moderation)
 * DELETE /api/admin/messages/:id
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await sql`
    DELETE FROM messages
    WHERE id = ${id}
    RETURNING id
  `;

  if (result.length === 0) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }

  logger.info('Message deleted by admin', { messageId: id, adminId: req.user.id });
  return sendSuccess(res, 'Message deleted successfully');
});

/**
 * Get all categories
 * GET /api/admin/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await sql`
    SELECT 
      c.*,
      COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category = c.slug
    GROUP BY c.id
    ORDER BY c.name
  `;

  return sendSuccess(res, 'Categories retrieved successfully', categories);
});

/**
 * Create new category
 * POST /api/admin/categories
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, icon_url } = req.body;

  const result = await sql`
    INSERT INTO categories (name, slug, description, icon_url)
    VALUES (${name}, ${slug}, ${description}, ${icon_url || null})
    RETURNING *
  `;

  logger.info('Category created', { category: result[0], adminId: req.user.id });
  return sendCreated(res, 'Category created successfully', result[0]);
});

/**
 * Update category
 * PATCH /api/admin/categories/:id
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, icon_url, is_active } = req.body;

  const result = await sql`
    UPDATE categories
    SET 
      name = COALESCE(${name}, name),
      slug = COALESCE(${slug}, slug),
      description = COALESCE(${description}, description),
      icon_url = COALESCE(${icon_url}, icon_url),
      is_active = COALESCE(${is_active}, is_active),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  logger.info('Category updated', { categoryId: id, adminId: req.user.id });
  return sendSuccess(res, 'Category updated successfully', result[0]);
});

/**
 * Delete category
 * DELETE /api/admin/categories/:id
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category has products
  const productCheck = await sql`
    SELECT COUNT(*) as count FROM products WHERE category = (
      SELECT slug FROM categories WHERE id = ${id}
    )
  `;

  if (productCheck[0].count > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete category with ${productCheck[0].count} products. Please reassign or delete products first.`,
    });
  }

  const result = await sql`
    DELETE FROM categories
    WHERE id = ${id}
    RETURNING id
  `;

  if (result.length === 0) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  logger.info('Category deleted', { categoryId: id, adminId: req.user.id });
  return sendSuccess(res, 'Category deleted successfully');
});

/**
 * Toggle featured status for product
 * PATCH /api/admin/products/:id/featured
 */
const toggleFeaturedProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { featured } = req.body;

  const result = await sql`
    UPDATE products
    SET featured = ${featured}
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  logger.info('Product featured status toggled', { productId: id, featured, adminId: req.user.id });
  return sendSuccess(res, 'Product featured status updated', result[0]);
});

/**
 * Verify user account
 * PATCH /api/admin/users/:id/verify
 */
const verifyUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await sql`
    UPDATE users
    SET email_verified = true
    WHERE id = ${id}
    RETURNING *
  `;

  if (result.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  logger.info('User verified by admin', { userId: id, adminId: req.user.id });
  return sendSuccess(res, 'User verified successfully');
});

/**
 * Bulk delete products
 * POST /api/admin/products/bulk-delete
 */
const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { productIds } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Product IDs array is required' });
  }

  const result = await sql`
    DELETE FROM products
    WHERE id = ANY(${productIds})
    RETURNING id
  `;

  logger.warn('Bulk product deletion', { count: result.length, adminId: req.user.id });
  return sendSuccess(res, `${result.length} products deleted successfully`);
});

/**
 * Bulk update product status
 * POST /api/admin/products/bulk-status
 */
const bulkUpdateProductStatus = asyncHandler(async (req, res) => {
  const { productIds, status } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Product IDs array is required' });
  }

  const result = await sql`
    UPDATE products
    SET status = ${status}
    WHERE id = ANY(${productIds})
    RETURNING id
  `;

  logger.info('Bulk product status update', { count: result.length, status, adminId: req.user.id });
  return sendSuccess(res, `${result.length} products updated to ${status}`);
});

/**
 * Get platform statistics
 * GET /api/admin/stats/platform
 */
const getPlatformStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // Daily registrations
  const dailyStats = await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as registrations
    FROM users
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  // Product listings over time
  const productGrowth = await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as listings,
      category
    FROM products
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at), category
    ORDER BY date DESC
  `;

  // Top sellers
  const topSellers = await sql`
    SELECT 
      u.email,
      p.display_name,
      COUNT(pr.id) as product_count,
      SUM(pr.views) as total_views
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    LEFT JOIN products pr ON u.id = pr.seller_id
    WHERE p.user_type IN ('seller', 'landlord')
    GROUP BY u.id, u.email, p.display_name
    ORDER BY product_count DESC
    LIMIT 10
  `;

  // Message activity
  const messageActivity = await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as messages
    FROM messages
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  return sendSuccess(res, 'Platform statistics retrieved', {
    dailyStats,
    productGrowth,
    topSellers,
    messageActivity,
  });
});

module.exports = {
  getDashboardStats,
  getUsers,
  getProducts,
  updateProductStatus,
  deleteProduct,
  updateUserRole,
  suspendUser,
  getActivityLogs,
  // New endpoints
  getMessages,
  deleteMessage,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleFeaturedProduct,
  verifyUser,
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  getPlatformStats,
};
