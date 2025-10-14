// Google Analytics 4
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_title: document.title,
      page_location: window.location.href
    });
  }
};

// Track page views
export const trackPageView = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: url,
      page_title: document.title,
      page_location: window.location.href
    });
  }
};

// Track events
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Track user actions
export const trackUserAction = (action, details = {}) => {
  const events = {
    'user_register': () => trackEvent('register', 'user', 'registration', 1),
    'user_login': () => trackEvent('login', 'user', 'authentication', 1),
    'shipment_create': () => trackEvent('create_shipment', 'shipment', details.category, details.value),
    'offer_create': () => trackEvent('create_offer', 'offer', 'carrier_offer', details.value),
    'offer_accept': () => trackEvent('accept_offer', 'offer', 'offer_accepted', details.value),
    'payment_complete': () => trackEvent('purchase', 'payment', 'transaction', details.value),
    'page_view': () => trackPageView(details.url)
  };

  if (events[action]) {
    events[action]();
  }
};

// Performance monitoring
export const trackPerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = window.performance.getEntriesByType('navigation')[0];
    
    if (navigation) {
      const metrics = {
        page_load_time: navigation.loadEventEnd - navigation.loadEventStart,
        dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        first_paint: 0,
        first_contentful_paint: 0
      };

      // First Paint
      const paintEntries = window.performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          metrics.first_paint = entry.startTime;
        }
        if (entry.name === 'first-contentful-paint') {
          metrics.first_contentful_paint = entry.startTime;
        }
      });

      // Send to analytics
      trackEvent('performance', 'page_load', 'timing', Math.round(metrics.page_load_time));
    }
  }
};

// Error tracking
export const trackError = (error, context = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      custom_map: context
    });
  }
  
  // Also log to console for development
  console.error('Tracked Error:', error, context);
};

// User engagement tracking
export const trackEngagement = (action, duration = 0) => {
  trackEvent('engagement', 'user_interaction', action, duration);
};

// Conversion tracking
export const trackConversion = (conversionType, value) => {
  trackEvent('conversion', 'business', conversionType, value);
};





