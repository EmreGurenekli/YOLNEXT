const http = require('http');

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
  console.log('\n=== Testing Ratings API with Valid User ID ===\n');

  // Step 1: Get a fresh demo token
  console.log('1. Getting fresh demo token...');
  let demoToken;
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/demo-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginData = { email: 'demo@individual.com' };
    const response = await makeRequest(options, loginData);
    console.log('Login Status:', response.statusCode);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      demoToken = data.token;
      console.log('Token received:', demoToken.substring(0, 50) + '...');
      console.log('User ID:', data.user.id);
    } else {
      console.log('Login failed:', response.body);
      return;
    }
  } catch (error) {
    console.error('Login Error:', error.message);
    return;
  }

  // Step 2: Test GET ratings with valid integer user ID (use user ID 907 from demo login)
  console.log('\n2. Testing GET /api/ratings/907 (valid integer ID)');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ratings/907',
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

  // Step 3: Test POST rating with valid integer user IDs
  console.log('\n3. Testing POST /api/ratings');
  try {
    const ratingData = {
      ratedUserId: 907,  // Use integer instead of string
      rating: 5,
      comment: 'Test rating from API check',
      shipmentId: 1  // Use integer shipment ID
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

  // Step 4: Test GET again to see the rating
  console.log('\n4. Testing GET /api/ratings/907 (after POST)');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ratings/907',
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

  console.log('\n=== Test Complete ===');
}

// Run the tests
testRatingsAPI().catch(console.error);
