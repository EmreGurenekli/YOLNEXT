#!/usr/bin/env node
/**
 * Health Check Script
 * Checks all production health endpoints
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_URL = process.env.API_URL || 'http://localhost:5000';

class HealthChecker {
  constructor() {
    this.results = [];
  }

  async checkEndpoint(name, path) {
    const url = new URL(path, API_URL);
    const client = url.protocol === 'https:' ? https : http;

    return new Promise((resolve) => {
      const startTime = Date.now();
      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const result = {
            name,
            path,
            status: res.statusCode,
            responseTime,
            healthy: res.statusCode === 200,
            data: data ? JSON.parse(data) : null,
          };
          this.results.push(result);
          resolve(result);
        });
      });

      req.on('error', (error) => {
        const result = {
          name,
          path,
          status: 'ERROR',
          responseTime: Date.now() - startTime,
          healthy: false,
          error: error.message,
        };
        this.results.push(result);
        resolve(result);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        const result = {
          name,
          path,
          status: 'TIMEOUT',
          responseTime: 5000,
          healthy: false,
          error: 'Request timeout',
        };
        this.results.push(result);
        resolve(result);
      });
    });
  }

  async run() {
    console.log('🏥 Running health checks...\n');
    console.log(`API URL: ${API_URL}\n`);

    await Promise.all([
      this.checkEndpoint('Liveness', '/api/health/live'),
      this.checkEndpoint('Readiness', '/api/health/ready'),
      this.checkEndpoint('Full Health', '/api/health'),
    ]);

    this.printResults();
  }

  printResults() {
    console.log('📊 Health Check Results:');
    console.log('='.repeat(50));

    let allHealthy = true;

    this.results.forEach(result => {
      const status = result.healthy ? '✅' : '❌';
      const statusText = result.status === 200 ? 'HEALTHY' : 'UNHEALTHY';
      
      console.log(`${status} ${result.name}: ${statusText}`);
      console.log(`   Path: ${result.path}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Response Time: ${result.responseTime}ms`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.data) {
        console.log(`   Details: ${JSON.stringify(result.data, null, 2)}`);
      }
      
      console.log('');

      if (!result.healthy) {
        allHealthy = false;
      }
    });

    console.log('='.repeat(50));
    
    if (allHealthy) {
      console.log('✅ All health checks passed!');
      process.exit(0);
    } else {
      console.log('❌ Some health checks failed!');
      process.exit(1);
    }
  }
}

// Run health check
if (require.main === module) {
  const checker = new HealthChecker();
  checker.run().catch(console.error);
}

module.exports = HealthChecker;

