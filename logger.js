/**
 * Lightweight structured logging for browser applications
 * Corp QA compliant logging with levels and timestamps
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor(level = LogLevel.INFO) {
    this.level = level;
    this.enableConsole = true;
  }

  /**
   * Formats log entry with timestamp and context
   * @private
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @returns {Object} Formatted log entry
   */
  formatLog(level, message, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
  }

  /**
   * Outputs log to console and optionally stores
   * @private
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Function} consoleFn - Console function to use
   */
  log(level, message, context, consoleFn) {
    const logEntry = this.formatLog(level, message, context);

    if (this.enableConsole) {
      consoleFn(logEntry);
    }

    // Store in localStorage for debugging (last 100 entries)
    this.storeLog(logEntry);
  }

  /**
   * Stores log entries in localStorage for debugging
   * @private
   * @param {Object} logEntry - Log entry to store
   */
  storeLog(logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(logEntry);

      // Keep only last 100 entries
      if (logs.length > 100) {
        logs.shift();
      }

      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      // Silently fail if localStorage is full
    }
  }

  /**
   * Logs debug message
   * @param {string} message - Debug message
   * @param {Object} context - Additional context
   */
  debug(message, context = {}) {
    if (this.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, context, console.debug);
    }
  }

  /**
   * Logs info message
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    if (this.level <= LogLevel.INFO) {
      this.log('INFO', message, context, console.log);
    }
  }

  /**
   * Logs warning message
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    if (this.level <= LogLevel.WARN) {
      this.log('WARN', message, context, console.warn);
    }
  }

  /**
   * Logs error message
   * @param {string} message - Error message
   * @param {Object} context - Additional context including error object
   */
  error(message, context = {}) {
    if (this.level <= LogLevel.ERROR) {
      this.log('ERROR', message, context, console.error);
    }
  }

  /**
   * Retrieves stored logs from localStorage
   * @returns {Array} Array of log entries
   */
  getLogs() {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clears stored logs
   */
  clearLogs() {
    localStorage.removeItem('app_logs');
  }

  /**
   * Exports logs as downloadable JSON file
   */
  exportLogs() {
    const logs = this.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `app-logs-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}

// Create singleton instance
// Detect environment: localhost/127.0.0.1 = development, otherwise production
const isDevelopment =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '';

const logger = new Logger(isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);

// Export for use in other modules
window.logger = logger;
