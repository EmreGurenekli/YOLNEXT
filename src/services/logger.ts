export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

import { createApiUrl } from '../config/api';

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private readonly isDevelopment = import.meta.env.DEV;
  private readonly logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
  private readonly enableMetrics =
    import.meta.env.VITE_ENABLE_METRICS === 'true';
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    const currentLevelIndex = levels.indexOf(this.logLevel as LogLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }

    return `${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);

    if (this.isDevelopment) {
      this.logToConsole(level, formattedMessage, data);
    } else {
      this.sendToLoggingService(level, message, data);
    }
  }

  private logToConsole(level: LogLevel, message: string, data?: any) {
    const styles = {
      [LogLevel.ERROR]: 'color: #ff4444; font-weight: bold;',
      [LogLevel.WARN]: 'color: #ffaa00; font-weight: bold;',
      [LogLevel.INFO]: 'color: #4444ff; font-weight: bold;',
      [LogLevel.DEBUG]: 'color: #666666; font-style: italic;',
    };

    console.log(`%c${message}`, styles[level], data || '');
  }

  private async sendToLoggingService(
    level: LogLevel,
    message: string,
    data?: any
  ) {
    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
    };

    try {
      await fetch(createApiUrl('/api/logs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      // Fallback to console in case of network issues
      console.error('Failed to send log to server:', error);
    }
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  // API logging
  apiRequest(method: string, url: string, data?: any) {
    this.info(`API Request: ${method} ${url}`, data);
  }

  apiResponse(method: string, url: string, status: number, data?: any) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${url} - ${status}`, data);
  }

  // User action logging
  userAction(action: string, data?: any) {
    this.info(`User Action: ${action}`, data);
  }

  // Performance logging
  performance(operation: string, duration: number, data?: any) {
    if (this.enableMetrics) {
      this.info(`Performance: ${operation} took ${duration}ms`, data);
    }
  }

  // Security logging
  security(event: string, data?: any) {
    this.warn(`Security Event: ${event}`, data);
  }

  // Business metrics
  businessMetric(metric: string, value: number, data?: any) {
    if (this.enableMetrics) {
      this.info(`Business Metric: ${metric} = ${value}`, data);
    }
  }
}

export const logger = new Logger();
export default logger;
