import React, { useState, useCallback, useRef, useEffect } from 'react';

// Safe state hook that prevents race conditions and stale closures
export const useSafeState = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  const isMountedRef = useRef(true);
  const stateRef = useRef<T>(initialState);

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((newState: T | ((prevState: T) => T)) => {
    if (!isMountedRef.current) return;

    if (typeof newState === 'function') {
      setState(prevState => {
        const result = (newState as (prevState: T) => T)(prevState);
        if (isMountedRef.current) {
          stateRef.current = result;
        }
        return result;
      });
    } else {
      setState(newState);
      if (isMountedRef.current) {
        stateRef.current = newState;
      }
    }
  }, []);

  const getCurrentState = useCallback(() => stateRef.current, []);

  return [state, safeSetState, getCurrentState] as const;
};

// Safe async state hook
export const useSafeAsyncState = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const safeSetState = useCallback((newState: T | ((prevState: T) => T)) => {
    if (!isMountedRef.current) return;

    if (typeof newState === 'function') {
      setState(prevState => (newState as (prevState: T) => T)(prevState));
    } else {
      setState(newState);
    }
  }, []);

  const executeAsync = useCallback(
    async <R>(
      asyncFunction: (signal: AbortSignal) => Promise<R>,
      onSuccess?: (result: R) => void,
      onError?: (error: Error) => void
    ) => {
      if (!isMountedRef.current) return;

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        setLoading(true);
        setError(null);

        const result = await asyncFunction(signal);

        if (isMountedRef.current && !signal.aborted) {
          setLoading(false);
          if (onSuccess) {
            onSuccess(result);
          }
        }
      } catch (err) {
        if (isMountedRef.current && !signal.aborted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setLoading(false);
          if (onError) {
            onError(error);
          }
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (!isMountedRef.current) return;
    setState(initialState);
    setLoading(false);
    setError(null);
  }, [initialState]);

  return {
    state,
    loading,
    error,
    setState: safeSetState,
    executeAsync,
    reset,
  };
};

// Safe reducer hook
export const useSafeReducer = <S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S
) => {
  const [state, setState] = useState<S>(initialState);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const dispatch = useCallback(
    (action: A) => {
      if (!isMountedRef.current) return;

      setState(prevState => reducer(prevState, action));
    },
    [reducer]
  );

  return [state, dispatch] as const;
};

// Safe context hook
export const useSafeContext = <T>(
  context: React.Context<T>,
  errorMessage = 'useSafeContext bir Provider içinde kullanılmalıdır'
) => {
  const contextValue = React.useContext(context);

  if (contextValue === undefined) {
    throw new Error(errorMessage);
  }

  return contextValue;
};

// Safe ref hook
export const useSafeRef = <T>(initialValue: T) => {
  const ref = useRef<T>(initialValue);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetRef = useCallback((newValue: T) => {
    if (isMountedRef.current) {
      ref.current = newValue;
    }
  }, []);

  return [ref, safeSetRef] as const;
};
