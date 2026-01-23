/**
<<<<<<< HEAD
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
=======
 * Sentry Configuration
 * 
 * Error tracking and performance monitoring
 * Only initialized in production
 */

export const initSentry = async () => {
  // Only initialize in production and if DSN is provided
  if (import.meta.env.MODE !== 'production' || !import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  try {
    // @ts-expect-error - Sentry is optional dependency
    const Sentry = await import('@sentry/react').catch(() => null);
    if (!Sentry) return;
    
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    });

    console.log('✅ Sentry initialized');
  } catch (error) {
    // Sentry not available, ignore
  }
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
};

export default initSentry;

