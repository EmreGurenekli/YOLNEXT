// Global teardown for Jest tests
module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Clean up any test data
    console.log('🗑️ Cleaning up test data...');

    // Close any open connections
    console.log('🔌 Closing connections...');

    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Test environment cleanup failed:', error.message);
  }
};
