import { useEffect } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Performance Observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.log('FCP:', entry.startTime);
            // Send to analytics
            sendMetric('fcp', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
        sendMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
          sendMetric('fid', fidEntry.processingStart - fidEntry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver(list => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        console.log('CLS:', clsValue);
        sendMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Page Load Time
    window.addEventListener('load', () => {
      const loadTime =
        performance.timing.loadEventEnd - performance.timing.navigationStart;
      console.log('Page Load Time:', loadTime);
      sendMetric('load_time', loadTime);
    });

    // Resource Timing
    const resourceObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          console.log(`Resource ${resource.name}:`, resource.duration);

          // Track slow resources
          if (resource.duration > 1000) {
            sendMetric('slow_resource', {
              url: resource.name,
              duration: resource.duration,
              size: resource.transferSize,
            });
          }
        }
      }
    });
    resourceObserver.observe({ entryTypes: ['resource'] });

    // Memory Usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory Usage:', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      });

      sendMetric('memory_usage', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      });
    }

    // Error Tracking
    window.addEventListener('error', event => {
      console.error('JavaScript Error:', event.error);
      sendMetric('js_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
      });
    });

    // Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled Promise Rejection:', event.reason);
      sendMetric('promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
      });
    });
  }, []);

  const sendMetric = (name: string, value: any) => {
    // Send to analytics service
    if (import.meta.env.MODE === 'production') {
      // In production, send to your analytics service
      console.log(`Analytics: ${name}`, value);

      // Example: Send to your backend
      fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          value,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(console.error);
    }
  };

  return {
    sendMetric,
  };
};
