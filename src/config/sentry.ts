/**
 * Sentry Configuration (Optional)
 * 
 * Error tracking - only if @sentry/react is installed
 * For minimum stack, this is optional
 */

export const initSentry = async () => {
  // Sentry removed from minimum stack - no-op function
  // If needed in future, install @sentry/react and uncomment below
  return;
  
  // Only initialize in production and if DSN is provided
  // if (import.meta.env.MODE !== 'production' || !import.meta.env.VITE_SENTRY_DSN) {
  //   return;
  // }
  // 
  // try {
  //   const Sentry = await import('@sentry/react').catch(() => null);
  //   if (!Sentry) return;
  //   // ... initialization code
  // } catch (error) {
  //   // Sentry not available, ignore
  // }
};

export default initSentry;










