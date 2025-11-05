// Check Vite server logs for actual errors
const http = require('http');

async function checkViteEndpoint(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'],
          body: data.substring(0, 500), // First 500 chars
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({ error: err.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Timeout' });
    });
  });
}

async function main() {
  console.log('Checking Vite endpoints for error messages...\n');
  
  const endpoints = [
    'http://localhost:5173/src/contexts/AuthContext.tsx',
    'http://localhost:5173/src/pages/individual/CreateShipment.tsx',
  ];
  
  for (const url of endpoints) {
    console.log(`Checking: ${url}`);
    const result = await checkViteEndpoint(url);
    
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}\n`);
    } else if (result.status === 500) {
      console.log(`  ❌ Status: ${result.status}`);
      console.log(`  Content-Type: ${result.contentType}`);
      console.log(`  Body preview:\n${result.body}\n`);
    } else {
      console.log(`  ✅ Status: ${result.status}\n`);
    }
  }
}

main();




