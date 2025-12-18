// Performance optimization utilities

// Debounce function for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Lazy loading for images
export const lazyLoadImage = (img: HTMLImageElement, src: string) => {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    },
    { threshold: 0.1 }
  );
  observer.observe(img);
};

// Memoization for expensive calculations
export const memoize = <T extends (...args: any[]) => any>(func: T): T => {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Virtual scrolling helper
export const getVisibleItems = (
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    totalItems
  );
  return { startIndex, endIndex };
};

// Bundle size optimization
import React from 'react';

export const loadComponent = (importFunc: () => Promise<any>) => {
  return React.lazy(importFunc);
};

// Memory management
export const cleanupResources = () => {
  // Clear intervals
  const highestTimeoutId = setTimeout(() => {}, 0);
  for (let i = 0; i < Number(highestTimeoutId); i++) {
    clearTimeout(i);
  }

  // Clear intervals
  const highestIntervalId = setInterval(() => {}, 0);
  for (let i = 0; i < Number(highestIntervalId); i++) {
    clearInterval(i);
  }
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  // Performance measurement (console.log removed for performance)
  if (import.meta.env.DEV && end - start > 100) {
    console.warn(`${name} took ${end - start}ms (slow)`);
  }
};

// Bundle analyzer helper
export const analyzeBundle = () => {
  // Bundle analyzer is not available in Vite
  // Log removed for performance
};
