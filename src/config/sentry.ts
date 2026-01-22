/**
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
};

export default initSentry;

