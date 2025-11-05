// 500 Error Debug Script
const http = require('http');

async function checkAPI(endpoint) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200),
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ error: 'Timeout' });
    });
  });
}

async function main() {
  console.log('\n🔍 500 Error Debug - Checking API Endpoints...\n');
  
  const endpoints = [
    '/api/health',
    '/api/auth/profile',
    '/api/dashboard/stats/individual',
    '/api/notifications/unread-count',
    '/api/shipments',
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    const result = await checkAPI(endpoint);
    
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}\n`);
    } else if (result.status === 500) {
      console.log(`  🔴 500 ERROR! Response: ${result.data}\n`);
    } else {
      console.log(`  ✅ Status: ${result.status}\n`);
    }
  }
  
  console.log('✅ Check complete!\n');
}

main().catch(console.error);




