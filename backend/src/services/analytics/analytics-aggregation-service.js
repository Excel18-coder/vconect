/**
 * Analytics Aggregation Service
 * Aggregates raw event data into daily metrics for fast dashboard queries
 *
 * Runs daily (via cron) to compute metrics like:
 * - Daily Active Users (DAU)
 * - New user registrations
 * - Product views, listings, sales
 * - Message volume
 * - Conversion metrics
 *
 * Pre-aggregated data stored in analytics_daily table
 */

const { sql } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Metric names
 */
const METRICS = {
  // User metrics
  DAU: 'dau', // Daily Active Users
  NEW_USERS: 'new_users',
  NEW_BUYERS: 'new_buyers',
  NEW_SELLERS: 'new_sellers',
  NEW_LANDLORDS: 'new_landlords',
  TOTAL_USERS: 'total_users',
  ACTIVE_BUYERS: 'active_buyers',
  ACTIVE_SELLERS: 'active_sellers',

  // Product metrics
  NEW_PRODUCTS: 'new_products',
  PRODUCT_VIEWS: 'product_views',
  PRODUCTS_SOLD: 'products_sold',
  TOTAL_ACTIVE_PRODUCTS: 'total_active_products',

  // Engagement metrics
  MESSAGES_SENT: 'messages_sent',
  NEW_FAVORITES: 'new_favorites',
  SEARCH_QUERIES: 'search_queries',
  UNIQUE_SEARCHERS: 'unique_searchers',

  // Conversion metrics
  VIEW_TO_MESSAGE_RATE: 'view_to_message_rate',
  LISTING_TO_SALE_RATE: 'listing_to_sale_rate',
};

class AnalyticsAggregationService {
  /**
   * Run all daily aggregations
   * Should be called once per day (via cron)
   */
  async aggregateDaily(date = null) {
    const targetDate = date || new Date();
    const dateStr = this.formatDate(targetDate);

    logger.info('Starting daily analytics aggregation', { date: dateStr });

    try {
      // Run all aggregations in parallel where possible
      await Promise.all([
        this.aggregateUserMetrics(dateStr),
        this.aggregateProductMetrics(dateStr),
        this.aggregateEngagementMetrics(dateStr),
      ]);

      // Compute derived metrics after base metrics are done
      await this.aggregateConversionMetrics(dateStr);

      logger.info('Daily analytics aggregation completed', { date: dateStr });
    } catch (error) {
      logger.error('Daily analytics aggregation failed', error, { date: dateStr });
      throw error;
    }
  }

  /**
   * Aggregate user metrics
   */
  async aggregateUserMetrics(date) {
    logger.debug('Aggregating user metrics', { date });

    // DAU - Users with any event on this date
    const dau = await sql`
      SELECT COUNT(DISTINCT user_id) as value
      FROM user_events
      WHERE DATE(created_at) = ${date}
        AND user_id IS NOT NULL
    `;
    await this.saveMetric(date, METRICS.DAU, dau[0].value);

    // New users registered on this date
    const newUsers = await sql`
      SELECT COUNT(*) as value
      FROM users
      WHERE DATE(created_at) = ${date}
    `;
    await this.saveMetric(date, METRICS.NEW_USERS, newUsers[0].value);

    // New users by type
    const newUsersByType = await sql`
      SELECT 
        p.user_type,
        COUNT(*) as value
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE DATE(u.created_at) = ${date}
      GROUP BY p.user_type
    `;

    for (const row of newUsersByType) {
      const metric =
        row.user_type === 'buyer'
          ? METRICS.NEW_BUYERS
          : row.user_type === 'seller'
          ? METRICS.NEW_SELLERS
          : row.user_type === 'landlord'
          ? METRICS.NEW_LANDLORDS
          : null;
      if (metric) {
        await this.saveMetric(date, metric, row.value);
      }
    }

    // Total users (cumulative)
    const totalUsers = await sql`
      SELECT COUNT(*) as value
      FROM users
      WHERE created_at <= ${date}
    `;
    await this.saveMetric(date, METRICS.TOTAL_USERS, totalUsers[0].value);

    // Active buyers (had activity in last 30 days as of this date)
    const activeBuyers = await sql`
      SELECT COUNT(DISTINCT ue.user_id) as value
      FROM user_events ue
      JOIN profiles p ON ue.user_id = p.user_id
      WHERE p.user_type = 'buyer'
        AND ue.created_at >= ${date}::date - INTERVAL '30 days'
        AND ue.created_at <= ${date}
    `;
    await this.saveMetric(date, METRICS.ACTIVE_BUYERS, activeBuyers[0].value);

    // Active sellers
    const activeSellers = await sql`
      SELECT COUNT(DISTINCT ue.user_id) as value
      FROM user_events ue
      JOIN profiles p ON ue.user_id = p.user_id
      WHERE p.user_type IN ('seller', 'landlord')
        AND ue.created_at >= ${date}::date - INTERVAL '30 days'
        AND ue.created_at <= ${date}
    `;
    await this.saveMetric(date, METRICS.ACTIVE_SELLERS, activeSellers[0].value);

    logger.debug('User metrics aggregated', { date });
  }

  /**
   * Aggregate product metrics
   */
  async aggregateProductMetrics(date) {
    logger.debug('Aggregating product metrics', { date });

    // New products listed
    const newProducts = await sql`
      SELECT COUNT(*) as value
      FROM listings
      WHERE DATE(created_at) = ${date}
    `;
    await this.saveMetric(date, METRICS.NEW_PRODUCTS, newProducts[0].value);

    // Product views from events
    const productViews = await sql`
      SELECT COUNT(*) as value
      FROM user_events
      WHERE DATE(created_at) = ${date}
        AND event_type = 'product.view'
    `;
    await this.saveMetric(date, METRICS.PRODUCT_VIEWS, productViews[0].value);

    // Products sold (status changed to 'sold')
    // Note: This assumes there's a status change tracking or we check listing status
    const productsSold = await sql`
      SELECT COUNT(*) as value
      FROM listings
      WHERE status = 'sold'
        AND DATE(updated_at) = ${date}
    `;
    await this.saveMetric(date, METRICS.PRODUCTS_SOLD, productsSold[0].value);

    // Total active products (snapshot at end of day)
    const activeProducts = await sql`
      SELECT COUNT(*) as value
      FROM listings
      WHERE status = 'active'
        AND created_at <= ${date}
    `;
    await this.saveMetric(date, METRICS.TOTAL_ACTIVE_PRODUCTS, activeProducts[0].value);

    // Products by category
    const productsByCategory = await sql`
      SELECT 
        l.category as category,
        COUNT(*) as value
      FROM listings l
      WHERE DATE(l.created_at) = ${date}
      GROUP BY l.category
    `;

    for (const row of productsByCategory) {
      await this.saveMetric(date, METRICS.NEW_PRODUCTS, row.value, { category: row.category });
    }

    logger.debug('Product metrics aggregated', { date });
  }

  /**
   * Aggregate engagement metrics
   */
  async aggregateEngagementMetrics(date) {
    logger.debug('Aggregating engagement metrics', { date });

    // Messages sent
    const messages = await sql`
      SELECT COUNT(*) as value
      FROM messages
      WHERE DATE(created_at) = ${date}
    `;
    await this.saveMetric(date, METRICS.MESSAGES_SENT, messages[0].value);

    // New favorites added
    const favorites = await sql`
      SELECT COUNT(*) as value
      FROM favorites
      WHERE DATE(created_at) = ${date}
    `;
    await this.saveMetric(date, METRICS.NEW_FAVORITES, favorites[0].value);

    // Search queries
    const searches = await sql`
      SELECT COUNT(*) as value
      FROM user_events
      WHERE DATE(created_at) = ${date}
        AND event_type = 'search.query'
    `;
    await this.saveMetric(date, METRICS.SEARCH_QUERIES, searches[0].value);

    // Unique users who searched
    const uniqueSearchers = await sql`
      SELECT COUNT(DISTINCT user_id) as value
      FROM user_events
      WHERE DATE(created_at) = ${date}
        AND event_type = 'search.query'
        AND user_id IS NOT NULL
    `;
    await this.saveMetric(date, METRICS.UNIQUE_SEARCHERS, uniqueSearchers[0].value);

    logger.debug('Engagement metrics aggregated', { date });
  }

  /**
   * Aggregate conversion metrics
   */
  async aggregateConversionMetrics(date) {
    logger.debug('Aggregating conversion metrics', { date });

    // View to message conversion rate
    const views = await this.getMetric(date, METRICS.PRODUCT_VIEWS);
    const messages = await this.getMetric(date, METRICS.MESSAGES_SENT);

    if (views > 0) {
      const rate = (messages / views) * 100;
      await this.saveMetric(date, METRICS.VIEW_TO_MESSAGE_RATE, rate);
    }

    // Listing to sale conversion rate (over last 30 days)
    const salesData = await sql`
      SELECT 
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold,
        COUNT(*) as total
      FROM listings
      WHERE created_at >= ${date}::date - INTERVAL '30 days'
        AND created_at <= ${date}
    `;

    if (salesData[0].total > 0) {
      const rate = (salesData[0].sold / salesData[0].total) * 100;
      await this.saveMetric(date, METRICS.LISTING_TO_SALE_RATE, rate);
    }

    logger.debug('Conversion metrics aggregated', { date });
  }

  /**
   * Save a metric to analytics_daily table
   */
  async saveMetric(date, metricName, metricValue, dimensions = {}) {
    try {
      await sql`
        INSERT INTO analytics_daily (date, metric_name, metric_value, dimensions)
        VALUES (${date}, ${metricName}, ${metricValue}, ${JSON.stringify(dimensions)})
        ON CONFLICT (date, metric_name, dimensions)
        DO UPDATE SET 
          metric_value = ${metricValue},
          updated_at = NOW()
      `;
    } catch (error) {
      logger.error('Failed to save metric', error, { date, metricName, metricValue });
      throw error;
    }
  }

  /**
   * Get a metric value
   */
  async getMetric(date, metricName, dimensions = {}) {
    try {
      const result = await sql`
        SELECT metric_value
        FROM analytics_daily
        WHERE date = ${date}
          AND metric_name = ${metricName}
          AND dimensions = ${JSON.stringify(dimensions)}
        LIMIT 1
      `;

      return result[0]?.metric_value || 0;
    } catch (error) {
      logger.error('Failed to get metric', error, { date, metricName });
      return 0;
    }
  }

  /**
   * Get metric trend (last N days)
   */
  async getMetricTrend(metricName, days = 30, dimensions = {}) {
    try {
      const result = await sql`
        SELECT date, metric_value
        FROM analytics_daily
        WHERE metric_name = ${metricName}
          AND dimensions = ${JSON.stringify(dimensions)}
          AND date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY date DESC
      `;

      return result;
    } catch (error) {
      logger.error('Failed to get metric trend', error, { metricName, days });
      throw error;
    }
  }

  /**
   * Get all metrics for a specific date
   */
  async getDateMetrics(date) {
    try {
      const result = await sql`
        SELECT metric_name, metric_value, dimensions
        FROM analytics_daily
        WHERE date = ${date}
        ORDER BY metric_name
      `;

      return result;
    } catch (error) {
      logger.error('Failed to get date metrics', error, { date });
      throw error;
    }
  }

  /**
   * Get dashboard KPIs
   */
  async getDashboardKPIs() {
    try {
      const today = this.formatDate(new Date());
      const yesterday = this.formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

      // Get today's and yesterday's metrics for comparison
      const todayMetrics = await this.getDateMetrics(today);
      const yesterdayMetrics = await this.getDateMetrics(yesterday);

      // Convert to map for easy lookup
      const todayMap = new Map(todayMetrics.map(m => [m.metric_name, m.metric_value]));
      const yesterdayMap = new Map(yesterdayMetrics.map(m => [m.metric_name, m.metric_value]));

      // Calculate changes
      const calculateChange = metric => {
        const todayValue = parseFloat(todayMap.get(metric) || 0);
        const yesterdayValue = parseFloat(yesterdayMap.get(metric) || 0);
        const change =
          yesterdayValue > 0 ? ((todayValue - yesterdayValue) / yesterdayValue) * 100 : 0;
        return {
          value: todayValue,
          change: change.toFixed(2),
          previousValue: yesterdayValue,
        };
      };

      return {
        dau: calculateChange(METRICS.DAU),
        newUsers: calculateChange(METRICS.NEW_USERS),
        newProducts: calculateChange(METRICS.NEW_PRODUCTS),
        productViews: calculateChange(METRICS.PRODUCT_VIEWS),
        messagesSent: calculateChange(METRICS.MESSAGES_SENT),
        totalUsers: parseFloat(todayMap.get(METRICS.TOTAL_USERS) || 0),
        totalActiveProducts: parseFloat(todayMap.get(METRICS.TOTAL_ACTIVE_PRODUCTS) || 0),
      };
    } catch (error) {
      logger.error('Failed to get dashboard KPIs', error);
      throw error;
    }
  }

  /**
   * Format date as YYYY-MM-DD
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Backfill historical data
   * Use with caution - can be resource intensive
   */
  async backfillHistorical(startDate, endDate) {
    logger.info('Starting historical data backfill', { startDate, endDate });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];

    // Generate all dates in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(this.formatDate(new Date(d)));
    }

    logger.info(`Backfilling ${dates.length} days`, { count: dates.length });

    // Process each date sequentially to avoid overwhelming the database
    for (const date of dates) {
      try {
        await this.aggregateDaily(new Date(date));
        logger.debug('Backfilled date', { date });
      } catch (error) {
        logger.error('Failed to backfill date', error, { date });
        // Continue with next date even if one fails
      }
    }

    logger.info('Historical data backfill completed');
  }
}

// Export singleton instance
const analyticsAggregationService = new AnalyticsAggregationService();

module.exports = {
  analyticsAggregationService,
  METRICS,
};
