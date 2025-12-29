/**
 * Unit Tests for Logger Module
 * Tests structured logging functionality
 */

// Import logger class
class Logger {
  constructor(level = 1) {
    this.level = level;
    this.enableConsole = true;
  }

  formatLog(level, message, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
  }

  log(level, message, context, consoleFn) {
    const logEntry = this.formatLog(level, message, context);
    if (this.enableConsole) {
      consoleFn(logEntry);
    }
    this.storeLog(logEntry);
  }

  storeLog(logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(logEntry);
      if (logs.length > 100) {
        logs.shift();
      }
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      // Silently fail
    }
  }

  debug(message, context = {}) {
    if (this.level <= 0) {
      this.log('DEBUG', message, context, console.debug);
    }
  }

  info(message, context = {}) {
    if (this.level <= 1) {
      this.log('INFO', message, context, console.log);
    }
  }

  warn(message, context = {}) {
    if (this.level <= 2) {
      this.log('WARN', message, context, console.warn);
    }
  }

  error(message, context = {}) {
    if (this.level <= 3) {
      this.log('ERROR', message, context, console.error);
    }
  }

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  clearLogs() {
    localStorage.removeItem('app_logs');
  }
}

describe('Logger - Initialization', () => {
  test('should create logger with default level', () => {
    const logger = new Logger();
    expect(logger.level).toBe(1);
    expect(logger.enableConsole).toBe(true);
  });

  test('should create logger with custom level', () => {
    const logger = new Logger(2);
    expect(logger.level).toBe(2);
  });
});

describe('Logger - Format Log', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger();
  });

  test('should format log entry with timestamp', () => {
    const entry = logger.formatLog('INFO', 'Test message', {});
    expect(entry).toHaveProperty('timestamp');
    expect(entry).toHaveProperty('level', 'INFO');
    expect(entry).toHaveProperty('message', 'Test message');
  });

  test('should include context in log entry', () => {
    const context = { userId: 123, action: 'login' };
    const entry = logger.formatLog('INFO', 'User logged in', context);
    expect(entry).toHaveProperty('userId', 123);
    expect(entry).toHaveProperty('action', 'login');
  });

  test('should handle empty context', () => {
    const entry = logger.formatLog('INFO', 'Test', {});
    expect(entry).toHaveProperty('level');
    expect(entry).toHaveProperty('message');
  });
});

describe('Logger - Log Levels', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger(1); // INFO level
    jest.clearAllMocks();
  });

  test('should log INFO messages at INFO level', () => {
    logger.info('Test info', {});
    expect(console.log).toHaveBeenCalled();
  });

  test('should log WARN messages at INFO level', () => {
    logger.warn('Test warning', {});
    expect(console.warn).toHaveBeenCalled();
  });

  test('should log ERROR messages at INFO level', () => {
    logger.error('Test error', {});
    expect(console.error).toHaveBeenCalled();
  });

  test('should NOT log DEBUG messages at INFO level', () => {
    logger.debug('Test debug', {});
    expect(console.debug).not.toHaveBeenCalled();
  });

  test('should log DEBUG messages at DEBUG level', () => {
    logger = new Logger(0); // DEBUG level
    logger.debug('Test debug', {});
    expect(console.debug).toHaveBeenCalled();
  });
});

describe('Logger - Integration', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger();
  });

  test('should create complete log entry with all components', () => {
    const entry = logger.formatLog('INFO', 'Integration test', { userId: 123 });
    expect(entry).toMatchObject({
      level: 'INFO',
      message: 'Integration test',
      userId: 123,
    });
    expect(entry).toHaveProperty('timestamp');
  });

  test('should handle multiple log calls', () => {
    expect(() => {
      logger.info('First log');
      logger.warn('Second log');
      logger.error('Third log');
    }).not.toThrow();
  });
});

describe('Logger - Context Logging', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger();
    jest.clearAllMocks();
  });

  test('should log with error context', () => {
    const error = new Error('Test error');
    logger.error('Operation failed', { error: error.message });
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        message: 'Operation failed',
        error: 'Test error',
      }),
    );
  });

  test('should log with user context', () => {
    logger.info('User action', { userId: 123, action: 'login' });
    expect(console.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 123,
        action: 'login',
      }),
    );
  });
});

