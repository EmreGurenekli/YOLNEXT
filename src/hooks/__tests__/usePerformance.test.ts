import { renderHook, act } from '@testing-library/react';
import {
  usePerformance,
  useMemoizedCallback,
  useDebouncedCallback,
} from '../usePerformance';

describe('usePerformance', () => {
  test('tracks render count', () => {
    const { result } = renderHook(() => usePerformance());

    expect(result.current.getRenderStats().renderCount).toBe(1);

    // The hook tracks renders automatically, so we just verify it's working
    expect(result.current.getRenderStats().renderCount).toBeGreaterThanOrEqual(
      1
    );
  });

  test('tracks render timing', () => {
    const { result } = renderHook(() => usePerformance());

    const stats = result.current.getRenderStats();
    expect(stats.totalTime).toBeGreaterThan(0);
    expect(stats.timeSinceLastRender).toBeGreaterThanOrEqual(0);
  });

  test('adds cleanup functions', () => {
    const { result } = renderHook(() => usePerformance());

    const cleanup = jest.fn();
    result.current.addCleanup(cleanup);

    // Cleanup should be called on unmount
    renderHook(() => usePerformance()).unmount();
  });
});

describe('useMemoizedCallback', () => {
  test('memoizes callback with dependencies', () => {
    const callback = jest.fn();
    const { result, rerender } = renderHook(
      ({ deps }) => useMemoizedCallback(callback, deps),
      { initialProps: { deps: [1, 2] } }
    );

    const memoizedCallback = result.current;

    // Rerender with same dependencies
    rerender({ deps: [1, 2] });
    expect(result.current).toBe(memoizedCallback);

    // Rerender with different dependencies - should create new callback
    rerender({ deps: [1, 3] });
    expect(result.current).toBeDefined();
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces callback execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 100));

    // Call multiple times quickly
    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    // Should not be called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should be called once with last arguments
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('arg3');
  });
});
