/**
 * Optimistic Update Utilities
 * Provides optimistic update pattern for better UX
 */

/**
 * Optimistic update hook
 */
export function useOptimisticUpdate<T>(
  updateFn: (data: T) => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error, rollback: () => void) => void
) {
  return async (optimisticData: T, actualData?: T) => {
    // Store original state for rollback
    const rollback = () => {
      // Rollback logic will be handled by the component
    };

    try {
      // Call update function
      const result = actualData ? await updateFn(actualData) : await updateFn(optimisticData);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error, rollback);
      }
      throw error;
    }
  };
}

/**
 * Optimistic state manager
 */
export class OptimisticStateManager<T> {
  private originalState: T | null = null;
  private optimisticState: T | null = null;

  setOptimistic(newState: T) {
    if (this.originalState === null) {
      this.originalState = newState;
    }
    this.optimisticState = newState;
    return this.optimisticState;
  }

  commit() {
    if (this.optimisticState) {
      this.originalState = this.optimisticState;
      this.optimisticState = null;
    }
    return this.originalState;
  }

  rollback() {
    this.optimisticState = null;
    return this.originalState;
  }

  getState() {
    return this.optimisticState || this.originalState;
  }
}








