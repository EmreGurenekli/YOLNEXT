// Hook exports - Centralized exports for better organization
// Only export hooks that exist and are properly exported

// Performance hooks
export { usePerformance } from './usePerformance';
<<<<<<< HEAD
=======
export { usePerformanceMonitoring } from './usePerformanceMonitoring';
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11

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

<<<<<<< HEAD
// Socket.io removed - using REST API only
=======
// Socket hooks - useSocket is a .js file, so we use default import
// @ts-expect-error - JS file doesn't have types
export { default as useSocket } from './useSocket';
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
