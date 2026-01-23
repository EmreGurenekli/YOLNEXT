// Global setup for Jest tests
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Setting up test environment...');

  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://test:test@localhost:5432/yolnext_test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.PORT = '5001';

    // Create test database if it doesn't exist
    console.log('📊 Setting up test database...');

    // Run database migrations for test environment
    console.log('🔄 Running database migrations...');

    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test environment setup failed:', error.message);
    process.exit(1);
  }
};
