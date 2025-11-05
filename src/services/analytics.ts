// Analytics service placeholder
// This file is intentionally empty as analytics functionality is not yet implemented

export const analytics = {
  track: (event: string, data?: any) => {
    // Placeholder for analytics tracking
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics track:', event, data);
    }
  },
};

