const { sql } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get AI-powered market insights and analytics
 */
const getMarketInsights = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  // Get category performance
  const categoryStats = await sql`
    SELECT 
      category,
      COUNT(*) as total_listings,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month,
      AVG(CAST(price AS NUMERIC)) as avg_price,
      SUM(views) as total_views
    FROM listings
    WHERE status = 'active'
    GROUP BY category
    ORDER BY total_listings DESC
  `;

  // Calculate trends (compare with previous period)
  const trendData = await sql`
    SELECT 
      category,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as current_month,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '60 days' 
                  AND created_at < NOW() - INTERVAL '30 days' THEN 1 END) as previous_month
    FROM listings
    WHERE status = 'active'
    GROUP BY category
  `;

  // Get high-demand products (most viewed/searched)
  const highDemand = await sql`
    SELECT 
      category,
      COUNT(*) as product_count,
      SUM(views) as total_views,
      AVG(CAST(price AS NUMERIC)) as avg_price
    FROM listings
    WHERE status = 'active' 
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY category
    HAVING SUM(views) > 100
    ORDER BY total_views DESC
    LIMIT 5
  `;

  // Get user's product performance if logged in
  let userProducts = null;
  if (userId) {
    userProducts = await sql`
      SELECT 
        category,
        COUNT(*) as total_products,
        SUM(views) as total_views,
        AVG(CAST(price AS NUMERIC)) as avg_price
      FROM listings
      WHERE user_id = ${userId}
        AND status = 'active'
      GROUP BY category
    `;
  }

  // Calculate market insights
  const insights = [];

  // Insight 1: High demand categories
  if (highDemand.length > 0) {
    const topCategory = highDemand[0];
    insights.push({
      id: 1,
      title: `High Demand for ${topCategory.category}`,
      description: `${topCategory.category} shows ${topCategory.total_views} views with ${topCategory.product_count} active listings. Average price: KSh ${Math.round(topCategory.avg_price).toLocaleString()}`,
      type: 'opportunity',
      impact: 'high',
      category: topCategory.category
    });
  }

  // Insight 2: Market trends
  trendData.forEach(trend => {
    const current = parseInt(trend.current_month) || 0;
    const previous = parseInt(trend.previous_month) || 0;
    if (previous > 0) {
      const growth = ((current - previous) / previous) * 100;
      if (Math.abs(growth) > 20) {
        insights.push({
          id: insights.length + 1,
          title: `${trend.category} ${growth > 0 ? 'Growth' : 'Decline'}`,
          description: `${trend.category} listings ${growth > 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(growth))}% this month compared to last month.`,
          type: growth > 0 ? 'trend' : 'warning',
          impact: Math.abs(growth) > 50 ? 'high' : 'medium',
          category: trend.category
        });
      }
    }
  });

  // Insight 3: User-specific insights
  if (userId && userProducts && userProducts.length > 0) {
    const userCategory = userProducts[0];
    const marketCategory = categoryStats.find(c => c.category === userCategory.category);
    if (marketCategory) {
      const userAvgPrice = parseFloat(userCategory.avg_price) || 0;
      const marketAvgPrice = parseFloat(marketCategory.avg_price) || 0;
      const priceDiff = ((userAvgPrice - marketAvgPrice) / marketAvgPrice) * 100;
      
      if (Math.abs(priceDiff) > 10) {
        insights.push({
          id: insights.length + 1,
          title: priceDiff > 0 ? 'Pricing Above Market' : 'Optimal Pricing Detected',
          description: `Your ${userCategory.category} products are priced ${Math.abs(Math.round(priceDiff))}% ${priceDiff > 0 ? 'above' : 'below'} market average. ${priceDiff < 0 ? 'This competitive pricing may attract more buyers.' : 'Consider adjusting prices to match market rates.'}`,
          type: 'recommendation',
          impact: Math.abs(priceDiff) > 20 ? 'high' : 'medium',
          category: userCategory.category
        });
      }
    }
  }

  // Calculate market trends with percentage change
  const marketTrends = trendData.map(trend => {
    const current = parseInt(trend.current_month) || 0;
    const previous = parseInt(trend.previous_month) || 0;
    const percentage = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    
    return {
      category: trend.category,
      trend: percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable',
      percentage: Math.round(percentage),
      volume: current
    };
  }).filter(t => t.volume > 0);

  // Calculate market score (0-100)
  const totalListings = categoryStats.reduce((sum, cat) => sum + parseInt(cat.total_listings), 0);
  const totalViews = categoryStats.reduce((sum, cat) => sum + parseInt(cat.total_views || 0), 0);
  const activeCategories = categoryStats.length;
  const marketScore = Math.min(100, Math.round((totalViews / totalListings) * 2 + activeCategories * 5));

  sendSuccess(res, {
    marketScore,
    totalOpportunities: insights.filter(i => i.type === 'opportunity').length,
    trendingCategories: marketTrends.filter(t => t.trend === 'up').length,
    insights: insights.slice(0, 10),
    marketTrends,
    categoryPerformance: categoryStats.map(cat => ({
      category: cat.category,
      listings: parseInt(cat.total_listings),
      avgPrice: Math.round(parseFloat(cat.avg_price) || 0),
      views: parseInt(cat.total_views || 0),
      growth: trendData.find(t => t.category === cat.category)?.current_month || 0
    }))
  });
});

/**
 * Get price predictions for a category
 */
const getPricePredictions = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const query = category
    ? sql`
        SELECT 
          category,
          subcategory,
          AVG(CAST(price AS NUMERIC)) as avg_price,
          MIN(CAST(price AS NUMERIC)) as min_price,
          MAX(CAST(price AS NUMERIC)) as max_price,
          COUNT(*) as sample_size
        FROM listings
        WHERE status = 'active'
          AND category = ${category}
          AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY category, subcategory
      `
    : sql`
        SELECT 
          category,
          AVG(CAST(price AS NUMERIC)) as avg_price,
          MIN(CAST(price AS NUMERIC)) as min_price,
          MAX(CAST(price AS NUMERIC)) as max_price,
          COUNT(*) as sample_size
        FROM listings
        WHERE status = 'active'
          AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY category
      `;

  const priceData = await query;

  const predictions = priceData.map(item => ({
    category: item.category,
    subcategory: item.subcategory || 'All',
    currentAvgPrice: Math.round(parseFloat(item.avg_price) || 0),
    predictedPrice: Math.round((parseFloat(item.avg_price) || 0) * 1.05), // 5% predicted increase
    priceRange: {
      min: Math.round(parseFloat(item.min_price) || 0),
      max: Math.round(parseFloat(item.max_price) || 0)
    },
    confidence: Math.min(95, 50 + (parseInt(item.sample_size) * 2)),
    sampleSize: parseInt(item.sample_size)
  }));

  sendSuccess(res, { predictions });
});

module.exports = {
  getMarketInsights,
  getPricePredictions
};
