// Optimized logger - reduces console overhead
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'error' : 'info');

const shouldLog = (level) => {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  return levels[level] <= levels[LOG_LEVEL];
};

// Batch console calls to reduce overhead
let logBuffer = [];
let flushTimeout = null;

const flushLogs = () => {
  if (logBuffer.length === 0) return;
  const logs = [...logBuffer];
  logBuffer = [];
  logs.forEach(({ method, args }) => {
    console[method](...args);
  });
};

const bufferedLog = (method, ...args) => {
  if (!shouldLog(method === 'error' ? 'error' : method === 'warn' ? 'warn' : 'info')) {
    return;
  }
  
  logBuffer.push({ method, args });
  
  if (flushTimeout) clearTimeout(flushTimeout);
  flushTimeout = setTimeout(flushLogs, 100); // Batch logs every 100ms
};

module.exports = {
  log: (...args) => shouldLog('info') && bufferedLog('log', ...args),
  error: (...args) => shouldLog('error') && bufferedLog('error', ...args),
  warn: (...args) => shouldLog('warn') && bufferedLog('warn', ...args),
  info: (...args) => shouldLog('info') && bufferedLog('info', ...args),
  debug: (...args) => shouldLog('debug') && bufferedLog('debug', ...args),
};
