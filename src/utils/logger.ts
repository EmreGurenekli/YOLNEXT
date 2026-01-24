/**
 * Logger utility - Re-export from services/logger for backward compatibility
 * This file exists to maintain compatibility with existing imports
 * All new code should import from '../services/logger' directly
 */

import { logger as servicesLogger } from '../services/logger';

// Re-export the logger instance with compatible API
export const logger = {
  log: (message: string, ...args: any[]) => servicesLogger.info(message, ...args),
  error: (message: string, ...args: any[]) => servicesLogger.error(message, ...args),
  warn: (message: string, ...args: any[]) => servicesLogger.warn(message, ...args),
  info: (message: string, ...args: any[]) => servicesLogger.info(message, ...args),
  debug: (message: string, ...args: any[]) => servicesLogger.debug(message, ...args),
};

// Re-export types
export { LogLevel, type LogEntry } from '../services/logger';

// For backward compatibility - can be used as drop-in replacement
export const debugLog = logger.log;
export const debugError = logger.error;
export const debugWarn = logger.warn;









