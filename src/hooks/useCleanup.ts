import { useEffect, useRef } from 'react';

interface CleanupFunction {
  (): void;
}

interface UseCleanupReturn {
  addCleanup: (cleanup: CleanupFunction) => void;
  cleanup: () => void;
}

export const useCleanup = (): UseCleanupReturn => {
  const cleanupFunctions = useRef<CleanupFunction[]>([]);

  const addCleanup = (cleanup: CleanupFunction) => {
    cleanupFunctions.current.push(cleanup);
  };

  const cleanup = () => {
    cleanupFunctions.current.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Cleanup function error:', error);
      }
    });
    cleanupFunctions.current = [];
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return { addCleanup, cleanup };
};

// Hook for managing timeouts
export const useTimeout = () => {
  const timeouts = useRef<number[]>([]);

  const setTimeout = (callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(callback, delay);
    timeouts.current.push(timeoutId);
    return timeoutId;
  };

  const clearAllTimeouts = () => {
    timeouts.current.forEach(timeoutId => {
      window.clearTimeout(timeoutId);
    });
    timeouts.current = [];
  };

  useEffect(() => {
    return clearAllTimeouts;
  }, []);

  return { setTimeout, clearAllTimeouts };
};

// Hook for managing intervals
export const useInterval = () => {
  const intervals = useRef<number[]>([]);

  const setInterval = (callback: () => void, delay: number) => {
    const intervalId = window.setInterval(callback, delay);
    intervals.current.push(intervalId);
    return intervalId;
  };

  const clearAllIntervals = () => {
    intervals.current.forEach(intervalId => {
      window.clearInterval(intervalId);
    });
    intervals.current = [];
  };

  useEffect(() => {
    return clearAllIntervals;
  }, []);

  return { setInterval, clearAllIntervals };
};

// Hook for managing event listeners
export const useEventListener = () => {
  const listeners = useRef<
    Array<{ element: EventTarget; event: string; handler: EventListener }>
  >([]);

  const addEventListener = (
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options);
    listeners.current.push({ element, event, handler });
  };

  const removeAllListeners = () => {
    listeners.current.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    listeners.current = [];
  };

  useEffect(() => {
    return removeAllListeners;
  }, []);

  return { addEventListener, removeAllListeners };
};
