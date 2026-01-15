/**
 * Enhanced Logger Utility with Performance Monitoring
 * Features:
 * - Structured logging with levels
 * - Performance tracking
 * - Request tracing
 * - Log aggregation for production
 * - Rate limiting for log spam prevention
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

class Logger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = process.env.LOG_LEVEL || 'info';
    
    // Performance tracking
    this.timers = new Map();
    this.metrics = {
      errors: 0,
      warnings: 0,
      info: 0,
      slowQueries: 0,
    };

    // Log spam prevention
    this.recentLogs = new Map();
    this.spamThreshold = 10; // Same log 10 times in 1 second = spam
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  /**
   * Prevent log spam
   */
  isSpam(message) {
    const now = Date.now();
    const key = JSON.stringify(message);
    const recent = this.recentLogs.get(key) || { count: 0, timestamp: now };

    // Reset counter if more than 1 second has passed
    if (now - recent.timestamp > 1000) {
      this.recentLogs.set(key, { count: 1, timestamp: now });
      return false;
    }

    recent.count++;
    this.recentLogs.set(key, recent);

    return recent.count > this.spamThreshold;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    
    if (this.isProduction) {
      // JSON format for production (easier to parse/aggregate)
      return JSON.stringify({
        timestamp,
        level,
        message,
        pid,
        ...meta,
      });
    }
    
    // Human-readable format for development
    const metaString = Object.keys(meta).length > 0 
      ? `\n  ${JSON.stringify(meta, null, 2)}`
      : '';
    return `[${timestamp}] [${level.toUpperCase()}] [PID:${pid}] ${message}${metaString}`;
  }

  /**
   * Debug level logging (most verbose)
   */
  debug(message, meta = {}) {
    if (!this.shouldLog('debug')) return;
    const formatted = this.formatMessage('debug', message, meta);
    console.log(`${colors.gray}${formatted}${colors.reset}`);
  }

  /**
   * Info level logging
   */
  info(message, meta = {}) {
    if (!this.shouldLog('info') || this.isSpam(message)) return;
    this.metrics.info++;
    const formatted = this.formatMessage('info', message, meta);
    console.log(`${colors.blue}${formatted}${colors.reset}`);
  }

  /**
   * Success logging (subset of info)
   */
  success(message, meta = {}) {
    if (!this.shouldLog('info')) return;
    const formatted = this.formatMessage('success', message, meta);
    console.log(`${colors.green}${formatted}${colors.reset}`);
  }

  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    if (!this.shouldLog('warn') || this.isSpam(message)) return;
    this.metrics.warnings++;
    const formatted = this.formatMessage('warn', message, meta);
    console.warn(`${colors.yellow}${formatted}${colors.reset}`);
  }

  /**
   * Error level logging
   */
  error(message, error = null, meta = {}) {
    if (!this.shouldLog('error')) return;
    
    this.metrics.errors++;
    
    const errorMeta = error ? {
      ...meta,
      errorMessage: error.message,
      errorName: error.name,
      errorCode: error.code,
      ...(this.isDevelopment && { stack: error.stack }),
    } : meta;
    
    const formatted = this.formatMessage('error', message, errorMeta);
    console.error(`${colors.red}${formatted}${colors.reset}`);
  }

  /**
   * Start performance timer
   */
  startTimer(label) {
    this.timers.set(label, Date.now());
  }

  /**
   * End performance timer and log if slow
   */
  endTimer(label, threshold = 1000) {
    const startTime = this.timers.get(label);
    if (!startTime) {
      this.warn(`Timer '${label}' was not started`);
      return;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    if (duration > threshold) {
      this.metrics.slowQueries++;
      this.warn(`Slow operation: ${label}`, { duration: `${duration}ms`, threshold: `${threshold}ms` });
    } else if (this.isDevelopment) {
      this.debug(`${label} completed`, { duration: `${duration}ms` });
    }

    return duration;
  }

  /**
   * Log HTTP request
   */
  request(req, res, duration) {
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    
    const meta = {
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.get('user-agent'),
    };

    if (statusCode >= 500) {
      this.error('HTTP Request Error', null, meta);
    } else if (statusCode >= 400) {
      this.warn('HTTP Request Warning', meta);
    } else if (duration > 3000) {
      this.warn('Slow HTTP Request', meta);
    } else {
      this.debug('HTTP Request', meta);
    }
  }

  /**
   * Log database query
   */
  query(query, duration) {
    const meta = {
      query: query.substring(0, 200), // Truncate long queries
      duration: `${duration}ms`,
    };

    if (duration > 1000) {
      this.warn('Slow database query', meta);
    } else {
      this.debug('Database query', meta);
    }
  }

  /**
   * Get aggregated metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeTimers: this.timers.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      errors: 0,
      warnings: 0,
      info: 0,
      slowQueries: 0,
    };
  }
}
    console.error(`${colors.red}${formattedMsg}${colors.reset}`);
  }

  debug(message, meta = {}) {
    if (!this.isProduction) {
      const formattedMsg = this.formatMessage('DEBUG', message, meta);
      console.log(`${colors.cyan}${formattedMsg}${colors.reset}`);
    }
  }

  http(method, path, status, duration) {
    const color = status >= 500 ? colors.red : status >= 400 ? colors.yellow : colors.green;
    console.log(`${color}${method} ${path} ${status} ${duration}ms${colors.reset}`);
  }
}

module.exports = new Logger();
