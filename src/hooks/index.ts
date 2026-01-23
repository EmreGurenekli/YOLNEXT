// Hook exports - Centralized exports for better organization
// Only export hooks that exist and are properly exported

// Performance hooks
export { usePerformance } from './usePerformance';

// API hooks  
export { useApiCache } from './useApiCache';
export { useApiWithRetry } from './useApiWithRetry';

// Form hooks
export { useFormValidation } from './useFormValidation';

// Error handling hooks
export { useErrorHandler } from './useErrorHandler';

// Utility hooks
export { useDebounce } from './useDebounce';
export { useSafeEffect } from './useSafeEffect';
export { useSafeState } from './useSafeState';
export { useCleanup } from './useCleanup';

// Socket.io removed - using REST API only
