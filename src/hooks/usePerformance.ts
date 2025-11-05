import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Performance monitoring hook with memory leak prevention
export const usePerformance = () => {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    renderCountRef.current += 1;
    const now = performance.now();

    if (startTimeRef.current === 0) {
      startTimeRef.current = now;
    }

    lastRenderTimeRef.current = now;

    // Cleanup function to prevent memory leaks
    return () => {
      cleanupRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup error:', error);
        }
      });
      cleanupRef.current = [];
    };
  });

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupRef.current.push(cleanup);
  }, []);

  const getRenderStats = useCallback(() => {
    const now = performance.now();
    const totalTime = now - startTimeRef.current;
    const timeSinceLastRender = now - lastRenderTimeRef.current;

    return {
      renderCount: renderCountRef.current,
      totalTime,
      timeSinceLastRender,
      averageRenderTime: totalTime / renderCountRef.current,
    };
  }, []);

  return { getRenderStats, addCleanup };
};

// Memoization hook with dependency tracking
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const ref = useRef<T>();
  const depsRef = useRef<React.DependencyList>();

  if (!depsRef.current || !areEqual(depsRef.current, deps)) {
    depsRef.current = deps;
    ref.current = callback;
  }

  return ref.current!;
};

// Deep equality check for dependencies
const areEqual = (
  a: React.DependencyList,
  b: React.DependencyList
): boolean => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
};

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const timeoutRef = useRef<number>();
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<number>();
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(
          () => {
            lastCallRef.current = Date.now();
            callbackRef.current(...args);
          },
          delay - (now - lastCallRef.current)
        );
      }
    }) as T,
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

// Virtual scrolling hook
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const scrollTopRef = useRef(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTopRef.current / itemHeight) - overscan
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTopRef.current + containerHeight) / itemHeight) +
        overscan
    );

    return { startIndex, endIndex };
  }, [items.length, itemHeight, containerHeight, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((scrollTop: number) => {
    scrollTopRef.current = scrollTop;
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  };
};

// Intersection observer hook
export const useIntersectionObserver = (
  targetRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [targetRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
};

// Resource preloading hook
export const useResourcePreloader = () => {
  const preloadedResources = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string): Promise<void> => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadScript = useCallback((src: string): Promise<void> => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });
  }, []);

  const preloadStylesheet = useCallback((href: string): Promise<void> => {
    if (preloadedResources.current.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      link.onload = () => {
        preloadedResources.current.add(href);
        resolve();
      };
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }, []);

  return {
    preloadImage,
    preloadScript,
    preloadStylesheet,
    isPreloaded: (src: string) => preloadedResources.current.has(src),
  };
};

// Bundle size optimization hook
export const useCodeSplitting = () => {
  const loadedModules = useRef<Map<string, any>>(new Map());

  const loadModule = useCallback(
    async <T>(
      moduleLoader: () => Promise<T>,
      moduleName: string
    ): Promise<T> => {
      if (loadedModules.current.has(moduleName)) {
        return loadedModules.current.get(moduleName);
      }

      try {
        const module = await moduleLoader();
        loadedModules.current.set(moduleName, module);
        return module;
      } catch (error) {
        // Error handled by error boundary
        throw error;
      }
    },
    []
  );

  const isModuleLoaded = useCallback((moduleName: string): boolean => {
    return loadedModules.current.has(moduleName);
  }, []);

  return {
    loadModule,
    isModuleLoaded,
  };
};
