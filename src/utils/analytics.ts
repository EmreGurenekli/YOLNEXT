// Google Analytics 4 Integration
export const GA4_TRACKING_ID = process.env.REACT_APP_GA4_TRACKING_ID || 'GA_MEASUREMENT_ID';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && GA4_TRACKING_ID) {
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_TRACKING_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA4_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href
    });
  }
};

// Track page views
export const trackPageView = (pageName: string, pagePath: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA4_TRACKING_ID, {
      page_title: pageName,
      page_location: window.location.origin + pagePath
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      event_category: 'user_interaction',
      ...parameters
    });
  }
};

// Track business events
export const trackBusinessEvent = (eventName: string, value?: number, currency?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      event_category: 'business',
      value: value,
      currency: currency || 'TRY'
    });
  }
};

// Track user actions
export const trackUserAction = (action: string, category: string, label?: string) => {
  trackEvent(action, {
    event_category: category,
    event_label: label
  });
};

// Track form submissions
export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent('form_submit', {
    event_category: 'form',
    form_name: formName,
    success: success
  });
};

// Track button clicks
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('button_click', {
    event_category: 'engagement',
    button_name: buttonName,
    location: location
  });
};

// Track errors
export const trackError = (error: string, fatal: boolean = false) => {
  trackEvent('exception', {
    event_category: 'error',
    description: error,
    fatal: fatal
  });
};

// Track performance
export const trackPerformance = (metricName: string, value: number) => {
  trackEvent('timing_complete', {
    event_category: 'performance',
    name: metricName,
    value: value
  });
};

// Track e-commerce events
export const trackEcommerce = (action: string, parameters: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: 'ecommerce',
      ...parameters
    });
  }
};

// Track shipment creation
export const trackShipmentCreation = (shipmentType: string, value: number) => {
  trackEcommerce('purchase', {
    transaction_id: `shipment_${Date.now()}`,
    value: value,
    currency: 'TRY',
    items: [{
      item_id: shipmentType,
      item_name: `Shipment - ${shipmentType}`,
      category: 'logistics',
      quantity: 1,
      price: value
    }]
  });
};

// Track offer submission
export const trackOfferSubmission = (offerValue: number, shipmentId: string) => {
  trackEcommerce('add_to_cart', {
    currency: 'TRY',
    value: offerValue,
    items: [{
      item_id: shipmentId,
      item_name: `Offer for Shipment ${shipmentId}`,
      category: 'logistics',
      quantity: 1,
      price: offerValue
    }]
  });
};

// Track user registration
export const trackUserRegistration = (userType: string) => {
  trackEvent('sign_up', {
    event_category: 'user',
    method: userType
  });
};

// Track user login
export const trackUserLogin = (userType: string) => {
  trackEvent('login', {
    event_category: 'user',
    method: userType
  });
};

// Track search
export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('search', {
    event_category: 'engagement',
    search_term: searchTerm,
    results_count: resultsCount
  });
};

// Track navigation
export const trackNavigation = (from: string, to: string) => {
  trackEvent('page_view', {
    event_category: 'navigation',
    from_page: from,
    to_page: to
  });
};

// Track API calls
export const trackAPICall = (endpoint: string, method: string, success: boolean, duration?: number) => {
  trackEvent('api_call', {
    event_category: 'technical',
    endpoint: endpoint,
    method: method,
    success: success,
    duration: duration
  });
};

// Track feature usage
export const trackFeatureUsage = (feature: string, action: string) => {
  trackEvent('feature_usage', {
    event_category: 'engagement',
    feature: feature,
    action: action
  });
};

// Track conversion
export const trackConversion = (conversionType: string, value?: number) => {
  trackEvent('conversion', {
    event_category: 'business',
    conversion_type: conversionType,
    value: value
  });
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackBusinessEvent,
  trackUserAction,
  trackFormSubmission,
  trackButtonClick,
  trackError,
  trackPerformance,
  trackEcommerce,
  trackShipmentCreation,
  trackOfferSubmission,
  trackUserRegistration,
  trackUserLogin,
  trackSearch,
  trackNavigation,
  trackAPICall,
  trackFeatureUsage,
  trackConversion
};





