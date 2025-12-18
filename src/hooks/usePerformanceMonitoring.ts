import { useEffect, useCallback } from 'react';
import { createApiUrl } from '../config/api';

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
            // FCP metric tracked (console.log removed for performance)
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
        // LCP metric tracked (console.log removed for performance)
        sendMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          // FID metric tracked (console.log removed for performance)
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
        // CLS metric tracked (console.log removed for performance)
        sendMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Page Load Time
    window.addEventListener('load', () => {
      const loadTime =
        performance.timing.loadEventEnd - performance.timing.navigationStart;
      // Page Load Time tracked (console.log removed for performance)
      sendMetric('load_time', loadTime);
    });

    // Resource Timing
    const resourceObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          // Resource timing tracked (console.log removed for performance)

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
      // Memory usage tracked (console.log removed for performance)

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
      fetch(createApiUrl('/api/analytics/metrics'), {
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
