const { sql } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get seller's revenue and earnings overview
 */
const getRevenueOverview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { period = '30' } = req.query; // days

  // Get total revenue from sold products
  // Note: This is a placeholder - you'll need to implement an orders/transactions table
  // For now, we'll calculate potential revenue from active listings

  const stats = await sql`
    SELECT 
      COUNT(*) as total_listings,
      SUM(views) as total_views,
      SUM(CAST(price AS NUMERIC)) as potential_revenue,
      AVG(CAST(price AS NUMERIC)) as avg_price
    FROM listings
    WHERE user_id = ${userId}
      AND status = 'active'
      AND created_at >= NOW() - INTERVAL '${period} days'
  `;

  // Get revenue by category
  const categoryRevenue = await sql`
    SELECT 
      category,
      COUNT(*) as product_count,
      SUM(CAST(price AS NUMERIC)) as total_value,
      SUM(views) as total_views
    FROM listings
    WHERE user_id = ${userId}
      AND status = 'active'
    GROUP BY category
    ORDER BY total_value DESC
  `;

  // Get top performing products
  const topProducts = await sql`
    SELECT 
      id,
      title,
      category,
      price,
      views,
      created_at
    FROM listings
    WHERE user_id = ${userId}
      AND status = 'active'
    ORDER BY views DESC
    LIMIT 5
  `;

  // Calculate revenue metrics
  const totalRevenue = Math.round(parseFloat(stats[0]?.potential_revenue || 0));
  const totalViews = parseInt(stats[0]?.total_views || 0);
  const totalListings = parseInt(stats[0]?.total_listings || 0);
  const avgPrice = Math.round(parseFloat(stats[0]?.avg_price || 0));

  // Mock conversion rate (you'll calculate this from actual sales)
  const conversionRate = totalViews > 0 ? Math.min(15, (totalListings / totalViews) * 100) : 0;

  sendSuccess(res, {
    overview: {
      totalRevenue,
      monthlyRevenue: Math.round(totalRevenue * 0.3), // Mock: 30% of total
      pendingRevenue: Math.round(totalRevenue * 0.06), // Mock: 6% pending
      availableRevenue: Math.round(totalRevenue * 0.24), // Mock: 24% available
      totalViews,
      totalListings,
      avgPrice,
      conversionRate: Math.round(conversionRate * 100) / 100
    },
    categoryBreakdown: categoryRevenue.map(cat => ({
      category: cat.category,
      revenue: Math.round(parseFloat(cat.total_value || 0)),
      productCount: parseInt(cat.product_count),
      views: parseInt(cat.total_views || 0),
      percentage: totalRevenue > 0 
        ? Math.round((parseFloat(cat.total_value) / totalRevenue) * 100) 
        : 0
    })),
    topProducts: topProducts.map(product => ({
      id: product.id,
      title: product.title,
      category: product.category,
      price: Math.round(parseFloat(product.price)),
      views: parseInt(product.views || 0),
      revenue: Math.round(parseFloat(product.price) * 0.1), // Mock: assume 10% conversion
      createdAt: product.created_at
    }))
  });
});

/**
 * Get transaction history
 * Note: This requires an orders/transactions table to be implemented
 */
const getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 10, offset = 0 } = req.query;

  // Mock transactions based on user's listings
  // In production, query from orders/transactions table
  const listings = await sql`
    SELECT 
      id,
      title,
      price,
      category,
      created_at,
      views
    FROM listings
    WHERE user_id = ${userId}
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT ${parseInt(limit)}
    OFFSET ${parseInt(offset)}
  `;

  // Mock transaction data
  const transactions = listings.map((listing, index) => ({
    id: `TXN${String(listing.id).padStart(6, '0')}`,
    description: `${listing.title} Sale`,
    amount: Math.round(parseFloat(listing.price)),
    status: index % 3 === 0 ? 'completed' : index % 3 === 1 ? 'pending' : 'completed',
    type: 'sale',
    category: listing.category,
    date: listing.created_at,
    buyer: {
      name: 'Anonymous Buyer',
      email: 'buyer@example.com'
    }
  }));

  const total = await sql`
    SELECT COUNT(*) as count
    FROM listings
    WHERE user_id = ${userId}
      AND status = 'active'
  `;

  sendSuccess(res, {
    transactions,
    pagination: {
      total: parseInt(total[0]?.count || 0),
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < parseInt(total[0]?.count || 0)
    }
  });
});

/**
 * Get revenue analytics and trends
 */
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { days = 30 } = req.query;

  // Get daily revenue trend
  const dailyTrend = await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as listings_created,
      SUM(CAST(price AS NUMERIC)) as daily_value,
      SUM(views) as daily_views
    FROM listings
    WHERE user_id = ${userId}
      AND created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  sendSuccess(res, {
    dailyTrend: dailyTrend.map(day => ({
      date: day.date,
      revenue: Math.round(parseFloat(day.daily_value || 0) * 0.1), // Mock: 10% conversion
      listings: parseInt(day.listings_created),
      views: parseInt(day.daily_views || 0)
    }))
  });
});

/**
 * Request payout
 */
const requestPayout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { amount, paymentMethod } = req.body;

  // Validate payout request
  if (!amount || amount <= 0) {
    return sendError(res, 'Invalid payout amount', 400);
  }

  // In production, create payout request in database
  // For now, return success message
  
  sendSuccess(res, {
    message: 'Payout request submitted successfully',
    payout: {
      id: `PAYOUT${Date.now()}`,
      amount,
      paymentMethod,
      status: 'pending',
      requestedAt: new Date(),
      estimatedArrival: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });
});

module.exports = {
  getRevenueOverview,
  getTransactions,
  getRevenueAnalytics,
  requestPayout
};
