/**
 * Email/SMS Retry Logic
 * Implements exponential backoff for email and SMS sending
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 30000; // 30 seconds
const DEFAULT_MULTIPLIER = 2;

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    initialDelay = DEFAULT_INITIAL_DELAY,
    maxDelay = DEFAULT_MAX_DELAY,
    multiplier = DEFAULT_MULTIPLIER,
    onRetry = null,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.code === 'EAUTH' || // Authentication error
          error.code === 'EENVELOPE' || // Invalid email
          error.responseCode === 400) { // Bad request
        throw error;
      }
      
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, error, delay);
        }
        
        await sleep(delay);
        delay = Math.min(delay * multiplier, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send email with retry
 */
async function sendEmailWithRetry(emailFn, to, subject, body, options = {}) {
  return retryWithBackoff(
    () => emailFn(to, subject, body),
    {
      maxRetries: options.maxRetries || 3,
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      multiplier: options.multiplier || 2,
      onRetry: (attempt, error, delay) => {
        console.warn(`⚠️ Email send retry attempt ${attempt}:`, error.message);
      },
    }
  );
}

/**
 * Send SMS with retry
 */
async function sendSMSWithRetry(smsFn, to, message, options = {}) {
  return retryWithBackoff(
    () => smsFn(to, message),
    {
      maxRetries: options.maxRetries || 3,
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      multiplier: options.multiplier || 2,
      onRetry: (attempt, error, delay) => {
        console.warn(`⚠️ SMS send retry attempt ${attempt}:`, error.message);
      },
    }
  );
}

module.exports = {
  retryWithBackoff,
  sendEmailWithRetry,
  sendSMSWithRetry,
  sleep,
};









