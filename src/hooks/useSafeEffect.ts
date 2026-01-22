import { useEffect, useRef, DependencyList } from 'react';

// Safe useEffect hook that prevents memory leaks
export const useSafeEffect = (
  effect: () => void | (() => void),
  deps?: DependencyList
) => {
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | void>();

  useEffect(() => {
    isMountedRef.current = true;

    const cleanup = effect();
    if (typeof cleanup === 'function') {
      cleanupRef.current = cleanup;
    }

    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
    };
  }, deps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
};

// Safe async effect hook
export const useSafeAsyncEffect = (
  effect: () => Promise<void | (() => void)>,
  deps?: DependencyList
) => {
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();

    const runEffect = async () => {
      try {
        const cleanup = await effect();
        if (typeof cleanup === 'function' && isMountedRef.current) {
          return cleanup;
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error('Asenkron efekt hatası:', error);
        }
      }
    };

    runEffect();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, deps);

  return abortControllerRef.current;
};

// Safe interval hook
export const useSafeInterval = (
  callback: () => void,
  delay: number | null,
  deps?: DependencyList
) => {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay !== null) {
      intervalRef.current = setInterval(() => {
        savedCallback.current();
      }, delay);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [delay, ...(deps || [])]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
};

// Safe timeout hook
export const useSafeTimeout = (
  callback: () => void,
  delay: number | null,
  deps?: DependencyList
) => {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay !== null) {
      timeoutRef.current = setTimeout(() => {
        savedCallback.current();
      }, delay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [delay, ...(deps || [])]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
};
