const { logger } = require('../utils/logger');

// Google Analytics 4 Integration
const googleAnalytics = (req, res, next) => {
  // Add GA4 tracking code to response
  const ga4Code = `
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: '${req.path}',
        page_location: '${req.protocol}://${req.get('host')}${req.path}'
      });
    </script>
  `;
  
  // Store GA4 code in response locals for use in templates
  res.locals.ga4Code = ga4Code;
  next();
};

// Custom Analytics Tracking
const customAnalytics = (req, res, next) => {
  const analyticsData = {
    event: 'page_view',
    page: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID || 'anonymous'
  };
  
  // Log analytics event
  logger.info('Analytics Event:', analyticsData);
  
  // Track specific events
  if (req.path.includes('/create-shipment')) {
    trackEvent('shipment_creation_started', req);
  } else if (req.path.includes('/offers')) {
    trackEvent('offer_viewed', req);
  } else if (req.path.includes('/dashboard')) {
    trackEvent('dashboard_accessed', req);
  }
  
  next();
};

// Event Tracking Function
const trackEvent = (eventName, req, additionalData = {}) => {
  const eventData = {
    event: eventName,
    page: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID || 'anonymous',
    ...additionalData
  };
  
  logger.info('Custom Event:', eventData);
  
  // Send to analytics service
  // This would typically integrate with services like:
  // - Google Analytics
  // - Mixpanel
  // - Amplitude
  // - Custom analytics service
};

// Business Metrics Tracking
const businessMetrics = (req, res, next) => {
  // Track key business metrics
  const metrics = {
    activeUsers: 1, // This would be calculated from actual data
    pageViews: 1,
    conversions: 0,
    revenue: 0,
    timestamp: new Date().toISOString()
  };
  
  // Log business metrics
  logger.info('Business Metrics:', metrics);
  
  next();
};

// User Behavior Tracking
const userBehaviorTracking = (req, res, next) => {
  const behaviorData = {
    userId: req.user?.id || 'anonymous',
    action: req.method,
    resource: req.path,
    timestamp: new Date().toISOString(),
    sessionDuration: req.session?.sessionDuration || 0,
    pageLoadTime: Date.now() - (req.startTime || Date.now())
  };
  
  // Track user journey
  if (req.session) {
    if (!req.session.userJourney) {
      req.session.userJourney = [];
    }
    req.session.userJourney.push({
      page: req.path,
      timestamp: new Date().toISOString(),
      action: req.method
    });
    
    // Keep only last 10 pages
    if (req.session.userJourney.length > 10) {
      req.session.userJourney = req.session.userJourney.slice(-10);
    }
  }
  
  logger.info('User Behavior:', behaviorData);
  next();
};

// Performance Metrics
const performanceMetrics = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const performanceData = {
      endpoint: `${req.method} ${req.path}`,
      responseTime: duration,
      statusCode: res.statusCode,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    logger.info('Performance Metrics:', performanceData);
    
    // Alert for performance issues
    if (duration > 3000) { // 3 seconds
      logger.warn('Slow endpoint detected:', performanceData);
    }
  });
  
  next();
};

// Error Analytics
const errorAnalytics = (err, req, res, next) => {
  const errorData = {
    error: err.message,
    stack: err.stack,
    endpoint: `${req.method} ${req.path}`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous'
  };
  
  logger.error('Error Analytics:', errorData);
  
  // Send to error tracking service
  // This would typically integrate with services like:
  // - Sentry
  // - Bugsnag
  // - Rollbar
  
  next(err);
};

module.exports = {
  googleAnalytics,
  customAnalytics,
  businessMetrics,
  userBehaviorTracking,
  performanceMetrics,
  errorAnalytics,
  trackEvent
};





