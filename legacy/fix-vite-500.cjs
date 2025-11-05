// Quick fix script - Check and restart if needed
const http = require('http');

async function checkVite() {
  return new Promise((resolve) => {
    http.get('http://localhost:5173', (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers['content-type'],
      });
    }).on('error', () => {
      resolve({ error: 'Server not accessible' });
    }).setTimeout(5000, () => {
      resolve({ error: 'Timeout' });
    });
  });
}

async function main() {
  console.log('\n🔍 Checking Vite Dev Server...\n');
  const result = await checkVite();
  
  if (result.error) {
    console.log(`❌ ${result.error}`);
    console.log('\n💡 Try: npm run dev');
  } else {
    console.log(`✅ Status: ${result.status}`);
    console.log(`   Content-Type: ${result.headers}`);
    
    if (result.status !== 200) {
      console.log('\n⚠️  Vite is running but returning non-200 status');
      console.log('   This might indicate a configuration issue');
    }
  }
}

main();




