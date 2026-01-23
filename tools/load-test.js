#!/usr/bin/env node
/**
 * Load Testing Script for YolNext
 * Tests API endpoints under various load conditions
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 10;
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER) || 100;
const TEST_DURATION = parseInt(process.env.TEST_DURATION) || 60; // seconds

class LoadTester {
  constructor() {
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      responseTimes: [],
      statusCodes: {},
    };
    this.startTime = Date.now();
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = new URL(endpoint, API_BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          this.stats.responseTimes.push(responseTime);
          this.stats.statusCodes[res.statusCode] = (this.stats.statusCodes[res.statusCode] || 0) + 1;

          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.stats.success++;
            resolve({ status: res.statusCode, data, responseTime });
          } else {
            this.stats.failed++;
            this.stats.errors.push({
              endpoint,
              status: res.statusCode,
              message: `HTTP ${res.statusCode}`,
            });
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        this.stats.failed++;
        this.stats.errors.push({ endpoint, error: error.message });
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async testEndpoint(endpoint, method = 'GET', body = null) {
    try {
      this.stats.total++;
      await this.makeRequest(endpoint, method, body);
    } catch (error) {
      // Error already logged
    }
  }

  async runUserSimulation(userId) {
    const endpoints = [
      { path: '/api/health', method: 'GET' },
      { path: '/api/health/live', method: 'GET' },
      { path: '/api/health/ready', method: 'GET' },
      { path: '/api/shipments', method: 'GET' },
      { path: '/api/shipments', method: 'GET' },
      { path: '/api/offers', method: 'GET' },
      { path: '/api/notifications', method: 'GET' },
    ];

    for (let i = 0; i < REQUESTS_PER_USER; i++) {
      const endpoint = endpoints[i % endpoints.length];
      await this.testEndpoint(endpoint.path, endpoint.method);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async run() {
    console.log('🚀 Starting load test...');
    console.log(`📊 Configuration:`);
    console.log(`   - API URL: ${API_BASE_URL}`);
    console.log(`   - Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`   - Requests per User: ${REQUESTS_PER_USER}`);
    console.log(`   - Test Duration: ${TEST_DURATION}s\n`);

    const users = Array.from({ length: CONCURRENT_USERS }, (_, i) => i + 1);
    const promises = users.map(userId => this.runUserSimulation(userId));

    // Run for specified duration
    const timeout = setTimeout(() => {
      console.log('\n⏱️ Test duration reached, stopping...');
    }, TEST_DURATION * 1000);

    await Promise.all(promises);
    clearTimeout(timeout);

    this.printResults();
  }

  printResults() {
    const duration = (Date.now() - this.startTime) / 1000;
    const avgResponseTime = this.stats.responseTimes.length > 0
      ? this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length
      : 0;
    const minResponseTime = this.stats.responseTimes.length > 0
      ? Math.min(...this.stats.responseTimes)
      : 0;
    const maxResponseTime = this.stats.responseTimes.length > 0
      ? Math.max(...this.stats.responseTimes)
      : 0;
    const successRate = this.stats.total > 0
      ? ((this.stats.success / this.stats.total) * 100).toFixed(2)
      : 0;
    const requestsPerSecond = (this.stats.total / duration).toFixed(2);

    console.log('\n📊 Load Test Results:');
    console.log('='.repeat(50));
    console.log(`Total Requests: ${this.stats.total}`);
    console.log(`Successful: ${this.stats.success}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Requests/Second: ${requestsPerSecond}`);
    console.log(`\nResponse Times:`);
    console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  Min: ${minResponseTime}ms`);
    console.log(`  Max: ${maxResponseTime}ms`);
    console.log(`\nStatus Codes:`);
    Object.entries(this.stats.statusCodes).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });

    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️ Errors (first 10):`);
      this.stats.errors.slice(0, 10).forEach(error => {
        console.log(`  - ${error.endpoint}: ${error.message || error.error}`);
      });
    }

    console.log('='.repeat(50));
  }
}

// Run load test
if (require.main === module) {
  const tester = new LoadTester();
  tester.run().catch(console.error);
}

module.exports = LoadTester;

