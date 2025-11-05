interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(
    level: string,
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    };
  }

  private log(
    level: string,
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ) {
    const logEntry = this.formatMessage(level, message, context, metadata);

    // Console logging
    if (this.isDevelopment) {
      const consoleMethod = level === 'info' ? console.log : 
                           level === 'warn' ? console.warn :
                           level === 'error' ? console.error :
                           console.log;
      consoleMethod(
        `[${logEntry.timestamp}] [${level.toUpperCase()}]`,
        message,
        metadata || ''
      );
    }

    // Production logging
    if (this.isProduction) {
      // Here you would typically send to external logging service
      // Examples: Sentry, LogRocket, DataDog, etc.
      this.sendToExternalService(logEntry);
    }
  }

  private sendToExternalService(logEntry: LogEntry) {
    // Mock external service call
    // In real implementation, you would send to your logging service
    if (logEntry.level === 'error') {
      console.error('Production error logged:', logEntry);
    }
  }

  error(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LOG_LEVELS.ERROR, message, context, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LOG_LEVELS.WARN, message, context, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LOG_LEVELS.INFO, message, context, metadata);
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    if (this.isDevelopment) {
      this.log(LOG_LEVELS.DEBUG, message, context, metadata);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export individual methods for convenience
export const log = (message: string, context?: string, metadata?: Record<string, any>) => {
  logger.info(message, context, metadata);
};
export const error = logger.error.bind(logger);
export const warn = logger.warn.bind(logger);
export const info = logger.info.bind(logger);
export const debug = logger.debug.bind(logger);

export default logger;
