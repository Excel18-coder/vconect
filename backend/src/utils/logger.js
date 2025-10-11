/**
 * Logger Utility
 * Structured logging with different levels
 * In production, you can replace this with Winston or Pino
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class Logger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaString}`;
  }

  info(message, meta = {}) {
    const formattedMsg = this.formatMessage('INFO', message, meta);
    console.log(`${colors.blue}${formattedMsg}${colors.reset}`);
  }

  success(message, meta = {}) {
    const formattedMsg = this.formatMessage('SUCCESS', message, meta);
    console.log(`${colors.green}${formattedMsg}${colors.reset}`);
  }

  warn(message, meta = {}) {
    const formattedMsg = this.formatMessage('WARN', message, meta);
    console.warn(`${colors.yellow}${formattedMsg}${colors.reset}`);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      ...meta,
      error: error.message,
      stack: this.isProduction ? undefined : error.stack
    } : meta;
    
    const formattedMsg = this.formatMessage('ERROR', message, errorMeta);
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
