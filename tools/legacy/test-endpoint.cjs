const fetch = (...args) =>
  import('node-fetch').then(({ default: fetchImpl }) => fetchImpl(...args));

async function testEndpoint() {
  try {
    console.log('Testing /api/shipments/nakliyeci/active endpoint...');
    
    const response = await fetch('http://localhost:5000/api/shipments/nakliyeci/active', {
      headers: {
        'Authorization': 'Bearer demo-jwt-token-nakliyeci-2001'
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

testEndpoint();