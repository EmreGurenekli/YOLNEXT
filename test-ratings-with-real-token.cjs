const http = require('http');

// Real demo token from the auth endpoint
const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjkwNywiZW1haWwiOiJkZW1vLmluZGl2aWR1YWxAeW9sbmV4dC5jb20iLCJwYW5lbF90eXBlIjoiaW5kaXZpZHVhbCIsImlzRGVtbyI6dHJ1ZSwiaWF0IjoxNzY2MjIyNjQ2LCJleHAiOjE3NjYzOTI2NDZ9.9hQOqXuQY8qKm7xJ3pL2vF1sW5gH8yN4zC6bE9dR7fA';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testRatingsAPI() {
  console.log('\n=== Testing Ratings API with Real Demo Token ===\n');

  // Test 1: GET ratings for a user (should return empty list for non-existent user)
  console.log('1. Testing GET /api/ratings/test-user-123');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ratings/test-user-123',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${demoToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    console.log('Status:', response.statusCode);
    const data = JSON.parse(response.body);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 2: POST a new rating
  console.log('\n2. Testing POST /api/ratings');
  try {
    const ratingData = {
      ratedUserId: 'test-user-123',
      rating: 5,
      comment: 'Test rating from API check',
      shipmentId: 'test-shipment-456'
    };

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ratings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${demoToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, ratingData);
    console.log('Status:', response.statusCode);
    const data = JSON.parse(response.body);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 3: GET ratings again to see the newly created rating
  console.log('\n3. Testing GET /api/ratings/test-user-123 (after POST)');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ratings/test-user-123',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${demoToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    console.log('Status:', response.statusCode);
    const data = JSON.parse(response.body);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 4: POST duplicate rating (should update existing rating)
  console.log('\n4. Testing POST /api/ratings (duplicate - should update)');
  try {
    const ratingData = {
      ratedUserId: 'test-user-123',
      rating: 4,
      comment: 'Updated rating from API check',
      shipmentId: 'test-shipment-456'
    };

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ratings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${demoToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, ratingData);
    console.log('Status:', response.statusCode);
    const data = JSON.parse(response.body);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 5: Test validation errors
  console.log('\n5. Testing POST /api/ratings (invalid rating value)');
  try {
    const ratingData = {
      ratedUserId: 'test-user-123',
      rating: 10, // Invalid: should be 1-5
      comment: 'Invalid rating test'
    };

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ratings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${demoToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, ratingData);
    console.log('Status:', response.statusCode);
    const data = JSON.parse(response.body);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 6: Test missing required fields
  console.log('\n6. Testing POST /api/ratings (missing ratedUserId)');
  try {
    const ratingData = {
      rating: 5,
      comment: 'Test with missing user ID'
    };

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ratings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${demoToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, ratingData);
    console.log('Status:', response.statusCode);
    const data = JSON.parse(response.body);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n=== Test Complete ===');
}

// Run the tests
testRatingsAPI().catch(console.error);
