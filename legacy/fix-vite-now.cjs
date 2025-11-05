// Quick Vite Fix Test
const http = require('http');

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'],
          dataLength: data.length,
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
  console.log('\n🔍 Testing Vite endpoints...\n');
  
  const tests = [
    { name: 'Root', url: 'http://localhost:5173/' },
    { name: 'Vite Client', url: 'http://localhost:5173/@vite/client' },
    { name: 'Main TSX', url: 'http://localhost:5173/src/main.tsx?t=123' },
  ];
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    const result = await testEndpoint(test.url);
    
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}\n`);
    } else if (result.status === 200) {
      console.log(`  ✅ Status: ${result.status}, Content-Type: ${result.contentType}, Size: ${result.dataLength}\n`);
    } else {
      console.log(`  ⚠️  Status: ${result.status}\n`);
    }
  }
}

main();




