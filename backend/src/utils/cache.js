/**
 * In-Memory Cache Utility
 * Simple but effective caching for database queries and API responses
 *
 * Features:
 * - TTL (Time To Live) support
 * - Size-based eviction (LRU)
 * - Cache statistics
 * - Tag-based invalidation
 *
 * Usage:
 *   const cache = require('./utils/cache');
 *
 *   // Set value
 *   cache.set('key', value, 300); // 300 seconds TTL
 *
 *   // Get value
 *   const data = cache.get('key');
 *
 *   // Delete value
 *   cache.del('key');
 */

const logger = require('./logger');

class Cache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000; // Maximum number of entries
    this.defaultTTL = options.defaultTTL || 300; // Default TTL in seconds
    this.store = new Map();
    this.tags = new Map(); // Tag-based cache groups
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
    };

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix
   * @param {any} identifier - Unique identifier
   * @returns {string} Cache key
   */
  generateKey(prefix, identifier) {
    return `${prefix}:${JSON.stringify(identifier)}`;
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttl] - TTL in seconds
   * @param {string[]} [tags] - Tags for group invalidation
   */
  set(key, value, ttl = null, tags = []) {
    try {
      // Enforce size limit (LRU eviction)
      if (this.store.size >= this.maxSize) {
        const firstKey = this.store.keys().next().value;
        this.delete(firstKey);
        this.stats.evictions++;
      }

      const expiresAt = ttl ? Date.now() + ttl * 1000 : Date.now() + this.defaultTTL * 1000;

      this.store.set(key, {
        value,
        expiresAt,
        createdAt: Date.now(),
        tags,
      });

      // Store tags for group invalidation
      tags.forEach(tag => {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag).add(key);
      });

      this.stats.sets++;

      logger.debug('Cache SET', { key, ttl, tags });
    } catch (error) {
      logger.error('Cache SET failed', error, { key });
    }
  }

  /**
   * Get cache value
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  get(key) {
    try {
      const entry = this.store.get(key);

      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      logger.debug('Cache HIT', { key });
      return entry.value;
    } catch (error) {
      logger.error('Cache GET failed', error, { key });
      return null;
    }
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted
   */
  delete(key) {
    try {
      const entry = this.store.get(key);

      if (entry) {
        // Remove from tags
        entry.tags.forEach(tag => {
          const tagSet = this.tags.get(tag);
          if (tagSet) {
            tagSet.delete(key);
            if (tagSet.size === 0) {
              this.tags.delete(tag);
            }
          }
        });
      }

      const deleted = this.store.delete(key);
      if (deleted) {
        this.stats.deletes++;
        logger.debug('Cache DELETE', { key });
      }
      return deleted;
    } catch (error) {
      logger.error('Cache DELETE failed', error, { key });
      return false;
    }
  }

  /**
   * Delete all entries with specific tag
   * @param {string} tag - Tag name
   * @returns {number} Number of entries deleted
   */
  deleteByTag(tag) {
    const keys = this.tags.get(tag);
    if (!keys) return 0;

    let deleted = 0;
    keys.forEach(key => {
      if (this.delete(key)) deleted++;
    });

    logger.info('Cache invalidated by tag', { tag, count: deleted });
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.store.clear();
    this.tags.clear();
    logger.info('Cache cleared');
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup', { cleaned });
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
        : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.store.size,
      maxSize: this.maxSize,
      tags: this.tags.size,
    };
  }

  /**
   * Wrap async function with caching
   * @param {string} key - Cache key
   * @param {Function} fn - Async function to cache
   * @param {number} [ttl] - TTL in seconds
   * @param {string[]} [tags] - Cache tags
   * @returns {Promise<any>} Function result
   */
  async wrap(key, fn, ttl = null, tags = []) {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn();

    // Cache result
    this.set(key, result, ttl, tags);

    return result;
  }

  /**
   * Graceful shutdown - clear interval
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    logger.info('Cache destroyed');
  }
}

// Export singleton instance
const cacheInstance = new Cache({
  maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 300,
});

// Graceful shutdown handling
process.on('SIGTERM', () => cacheInstance.destroy());
process.on('SIGINT', () => cacheInstance.destroy());

module.exports = cacheInstance;
