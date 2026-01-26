import { logger as servicesLogger } from '../services/logger';

export const logger = {
  log: (message: string, ...args: any[]) => servicesLogger.info(message, ...args),
  error: (message: string, ...args: any[]) => servicesLogger.error(message, ...args),
  warn: (message: string, ...args: any[]) => servicesLogger.warn(message, ...args),
  info: (message: string, ...args: any[]) => servicesLogger.info(message, ...args),
  debug: (message: string, ...args: any[]) => servicesLogger.debug(message, ...args),
};

export { LogLevel, type LogEntry } from '../services/logger';

export const debugLog = logger.log;
export const debugError = logger.error;
export const debugWarn = logger.warn;
