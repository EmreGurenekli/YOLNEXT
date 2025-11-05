// Fix 500 Error - Check what endpoint is being called incorrectly

// The issue: Frontend calls /api/users/profile but backend might not have this endpoint
// OR the endpoint exists but returns 500

// Check 1: What does userAPI.getProfile() actually call?
console.log('Checking API endpoint configuration...\n');

// From src/services/api.ts - should check API_ENDPOINTS.PROFILE
// Need to see what that resolves to

// Likely fixes needed:
// 1. Backend needs /api/users/profile endpoint OR
// 2. Frontend needs to call correct endpoint (maybe /api/auth/profile or /api/user/profile)

console.log('Most likely issue:');
console.log('- AuthContext calls userAPI.getProfile()');
console.log('- This might call /api/users/profile');
console.log('- Backend might not have this endpoint');
console.log('- Or endpoint exists but has a bug causing 500');
console.log('\nFix: Check backend for /api/users/profile endpoint');




