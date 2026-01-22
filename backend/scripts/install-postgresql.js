const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🐘 PostgreSQL Installation Helper');
console.log('================================');

// Check if PostgreSQL is already installed
function checkPostgreSQL() {
  try {
    execSync('psql --version', { stdio: 'pipe' });
    console.log('✅ PostgreSQL is already installed');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL not found');
    return false;
  }
}

// Installation instructions for different platforms
function showInstallInstructions() {
  const platform = process.platform;
  
  console.log('\n📋 PostgreSQL Installation Instructions:');
  console.log('==========================================');
  
  switch (platform) {
    case 'win32':
      console.log('Windows:');
      console.log('1. Download from: https://www.postgresql.org/download/windows/');
      console.log('2. Run installer and follow setup wizard');
      console.log('3. Remember the password you set for postgres user');
      console.log('4. Add PostgreSQL to PATH if not done automatically');
      break;
      
    case 'darwin':
      console.log('macOS:');
      console.log('1. Install Homebrew: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
      console.log('2. Install PostgreSQL: brew install postgresql@15');
      console.log('3. Start service: brew services start postgresql@15');
      break;
      
    case 'linux':
      console.log('Linux (Ubuntu/Debian):');
      console.log('1. Update package list: sudo apt update');
      console.log('2. Install PostgreSQL: sudo apt install postgresql postgresql-contrib');
      console.log('3. Start service: sudo systemctl start postgresql');
      console.log('4. Enable auto-start: sudo systemctl enable postgresql');
      break;
      
    default:
      console.log('Please visit: https://www.postgresql.org/download/');
  }
  
  console.log('\n🔧 After installation:');
  console.log('1. Create database: createdb yolnext_dev');
  console.log('2. Set environment: export DATABASE_URL="postgresql://username:password@localhost:5432/yolnext_dev"');
  console.log('3. Run setup: npm run db:setup');
}

// Create database if PostgreSQL is available
function createDatabase() {
  try {
    console.log('\n🗄️ Creating database...');
    execSync('createdb yolnext_dev', { stdio: 'pipe' });
    console.log('✅ Database yolnext_dev created successfully');
    
    console.log('\n🔧 Setting up environment...');
    const envContent = `# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/yolnext_dev
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=yolnext_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
ENABLE_METRICS=true
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created');
    
    return true;
  } catch (error) {
    console.log('❌ Database creation failed:', error.message);
    return false;
  }
}

// Main function
function main() {
  if (checkPostgreSQL()) {
    if (createDatabase()) {
      console.log('\n🎉 Setup complete! You can now run:');
      console.log('   npm run db:migrate');
      console.log('   npm run start:backend');
    } else {
      console.log('\n⚠️ Database creation failed. Please check PostgreSQL installation.');
    }
  } else {
    showInstallInstructions();
    console.log('\n💡 After installing PostgreSQL, run this script again.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkPostgreSQL, createDatabase, showInstallInstructions };


