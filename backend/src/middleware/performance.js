/**
 * Performance Monitoring Middleware
 * Tracks request duration, memory usage, and system metrics
 *
 * Features:
 * - Request timing
 * - Memory leak detection
 * - Slow endpoint alerts
 * - Performance metrics aggregation
 */

const logger = require('../utils/logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byEndpoint: new Map(),
        byMethod: new Map(),
        byStatus: new Map(),
      },
      timing: {
        slowRequests: [],
        averageDuration: 0,
        maxDuration: 0,
      },
      errors: {
        count: 0,
        byType: new Map(),
      },
    };

    this.slowRequestThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 3000;
    this.maxSlowRequests = 100; // Keep last 100 slow requests

    // Monitor memory every 30 seconds
    if (process.env.NODE_ENV === 'production') {
      this.memoryMonitorInterval = setInterval(() => {
        this.checkMemoryUsage();
      }, 30000);
    }
  }

  /**
   * Express middleware for performance monitoring
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();

      // Override res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = function (body) {
        res.locals.responseBody = body;
        return originalJson(body);
      };

      // Capture response finish event
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage();

        // Record metrics
        this.recordRequest({
          method: req.method,
          endpoint: this.normalizeEndpoint(req.originalUrl),
          status: res.statusCode,
          duration,
          memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
          userAgent: req.get('user-agent'),
          ip: req.ip,
        });

        // Log request
        logger.request(req, res, duration);

        // Alert on slow requests
        if (duration > this.slowRequestThreshold) {
          this.recordSlowRequest({
            method: req.method,
            endpoint: req.originalUrl,
            duration,
            timestamp: new Date().toISOString(),
          });
        }
      });

      next();
    };
  }

  /**
   * Normalize endpoint (remove IDs and query params)
   */
  normalizeEndpoint(url) {
    return url
      .split('?')[0] // Remove query params
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid'); // Replace UUIDs
  }

  /**
   * Record request metrics
   */
  recordRequest(data) {
    this.metrics.requests.total++;

    // By endpoint
    const endpointCount = this.metrics.requests.byEndpoint.get(data.endpoint) || 0;
    this.metrics.requests.byEndpoint.set(data.endpoint, endpointCount + 1);

    // By method
    const methodCount = this.metrics.requests.byMethod.get(data.method) || 0;
    this.metrics.requests.byMethod.set(data.method, methodCount + 1);

    // By status
    const statusCount = this.metrics.requests.byStatus.get(data.status) || 0;
    this.metrics.requests.byStatus.set(data.status, statusCount + 1);

    // Update timing
    this.metrics.timing.averageDuration =
      (this.metrics.timing.averageDuration * (this.metrics.requests.total - 1) + data.duration) /
      this.metrics.requests.total;

    if (data.duration > this.metrics.timing.maxDuration) {
      this.metrics.timing.maxDuration = data.duration;
    }
  }

  /**
   * Record slow request
   */
  recordSlowRequest(data) {
    this.metrics.timing.slowRequests.push(data);

    // Keep only last N slow requests
    if (this.metrics.timing.slowRequests.length > this.maxSlowRequests) {
      this.metrics.timing.slowRequests.shift();
    }

    logger.warn('Slow request detected', data);
  }

  /**
   * Check memory usage and alert if high
   */
  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    if (usagePercent > 90) {
      logger.error('Critical memory usage', null, {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        percentage: `${usagePercent.toFixed(2)}%`,
      });
    } else if (usagePercent > 80) {
      logger.warn('High memory usage', {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        percentage: `${usagePercent.toFixed(2)}%`,
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const memory = process.memoryUsage();

    return {
      requests: {
        total: this.metrics.requests.total,
        byEndpoint: Object.fromEntries(this.metrics.requests.byEndpoint),
        byMethod: Object.fromEntries(this.metrics.requests.byMethod),
        byStatus: Object.fromEntries(this.metrics.requests.byStatus),
      },
      timing: {
        average: Math.round(this.metrics.timing.averageDuration),
        max: this.metrics.timing.maxDuration,
        slowRequests: this.metrics.timing.slowRequests.length,
      },
      errors: {
        total: this.metrics.errors.count,
        byType: Object.fromEntries(this.metrics.errors.byType),
      },
      system: {
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(memory.external / 1024 / 1024) + 'MB',
        },
        cpu: process.cpuUsage(),
      },
    };
  }

  /**
   * Get slow requests
   */
  getSlowRequests(limit = 20) {
    return this.metrics.timing.slowRequests.slice(-limit);
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        byEndpoint: new Map(),
        byMethod: new Map(),
        byStatus: new Map(),
      },
      timing: {
        slowRequests: [],
        averageDuration: 0,
        maxDuration: 0,
      },
      errors: {
        count: 0,
        byType: new Map(),
      },
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Graceful shutdown
process.on('SIGTERM', () => performanceMonitor.destroy());
process.on('SIGINT', () => performanceMonitor.destroy());

module.exports = performanceMonitor;
