import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export function useApiCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  cacheTime: number = 5 * 60 * 1000 // 5 dakika
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestQueueRef = useRef<Map<string, Promise<T>>>(new Map());

  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const maxCacheSize = 100;

    if (cacheRef.current.size > maxCacheSize) {
      const entries = Array.from(cacheRef.current.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toDelete = entries.slice(0, entries.length - maxCacheSize);
      toDelete.forEach(([key]) => cacheRef.current.delete(key));
    }

    // Remove expired entries
    for (const [key, entry] of cacheRef.current.entries()) {
      if (now > entry.expiry) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  useEffect(() => {
    const now = Date.now();
    const cached = cacheRef.current.get(key);

    // Cache'den veri al
    if (cached && now < cached.expiry) {
      setData(cached.data);
      return;
    }

    // Check if request is already in progress
    if (requestQueueRef.current.has(key)) {
      requestQueueRef.current
        .get(key)!
        .then(result => {
          setData(result);
        })
        .catch(err => {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        });
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // API'den veri çek
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchFn();

        if (!abortControllerRef.current?.signal.aborted) {
          setData(result);

          // Cache'e kaydet
          cacheRef.current.set(key, {
            data: result,
            timestamp: now,
            expiry: now + cacheTime,
          });

          cleanupCache();
        }

        return result;
      } catch (err) {
        if (!abortControllerRef.current?.signal.aborted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
        throw err;
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
        requestQueueRef.current.delete(key);
      }
    };

    const requestPromise = fetchData();
    requestQueueRef.current.set(key, requestPromise);

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      requestQueueRef.current.delete(key);
    };
  }, [key, fetchFn, cacheTime, cleanupCache]);

  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
    requestQueueRef.current.delete(key);
  }, [key]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    requestQueueRef.current.clear();
  }, []);

  return { data, loading, error, invalidate, clearCache };
}

export default useApiCache;
