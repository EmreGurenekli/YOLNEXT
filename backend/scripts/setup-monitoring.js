#!/usr/bin/env node
/**
 * Production Monitoring Setup Script
 * Configures monitoring and logging for production environment
 */

require('dotenv').config({ path: '.env.production' });
const fs = require('fs');
const path = require('path');

class MonitoringSetup {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.uploadsDir = path.join(__dirname, '../../uploads');
  }

  createDirectories() {
    console.log('📁 Creating necessary directories...');
    
    const dirs = [
      this.logsDir,
      this.uploadsDir,
      path.join(this.logsDir, 'error'),
      path.join(this.logsDir, 'combined'),
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created: ${dir}`);
      } else {
        console.log(`ℹ️  Exists: ${dir}`);
      }
    });
  }

  checkLoggingConfig() {
    console.log('\n📊 Checking logging configuration...');
    
    const required = {
      'LOG_LEVEL': process.env.LOG_LEVEL || 'info',
      'LOG_TO_FILE': process.env.LOG_TO_FILE || 'true',
      'LOG_FILE_PATH': process.env.LOG_FILE_PATH || path.join(this.logsDir, 'app.log'),
    };

    Object.entries(required).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    if (process.env.SENTRY_DSN) {
      console.log('✅ Sentry error tracking configured');
    } else {
      console.log('⚠️  Sentry DSN not configured (optional but recommended)');
    }
  }

  checkMetricsConfig() {
    console.log('\n📈 Checking metrics configuration...');
    
    if (process.env.ENABLE_METRICS === 'true') {
      console.log('✅ Metrics enabled');
      console.log(`   Metrics port: ${process.env.METRICS_PORT || 9090}`);
    } else {
      console.log('⚠️  Metrics not enabled');
    }
  }

  checkHealthChecks() {
    console.log('\n🏥 Checking health check configuration...');
    
    if (process.env.ENABLE_HEALTH_CHECKS === 'true') {
      console.log('✅ Health checks enabled');
      console.log('   Endpoints:');
      console.log('     - /api/health');
      console.log('     - /api/health/live');
      console.log('     - /api/health/ready');
    } else {
      console.log('⚠️  Health checks not explicitly enabled');
    }
  }

  generateMonitoringScript() {
    console.log('\n📝 Generating monitoring helper script...');
    
    const script = `#!/bin/bash
# Monitoring Helper Script
# Usage: ./monitor.sh [logs|metrics|health|all]

case "$1" in
  logs)
    echo "📋 Application Logs:"
    tail -f ${this.logsDir}/app.log
    ;;
  metrics)
    echo "📈 Metrics:"
    curl -s http://localhost:${process.env.METRICS_PORT || 9090}/metrics | head -20
    ;;
  health)
    echo "🏥 Health Check:"
    curl -s http://localhost:${process.env.PORT || 5000}/api/health | jq .
    ;;
  all)
    echo "📊 Full Status:"
    echo ""
    echo "Health:"
    curl -s http://localhost:${process.env.PORT || 5000}/api/health | jq .
    echo ""
    echo "Recent Logs:"
    tail -20 ${this.logsDir}/app.log
    ;;
  *)
    echo "Usage: $0 {logs|metrics|health|all}"
    exit 1
    ;;
esac
`;

    const scriptPath = path.join(__dirname, '../../tools/monitor.sh');
    fs.writeFileSync(scriptPath, script);
    console.log(`✅ Created: ${scriptPath}`);
  }

  async run() {
    console.log('🔧 Setting up production monitoring...\n');

    this.createDirectories();
    this.checkLoggingConfig();
    this.checkMetricsConfig();
    this.checkHealthChecks();
    this.generateMonitoringScript();

    console.log('\n✅ Monitoring setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Configure SENTRY_DSN in .env.production (optional)');
    console.log('   2. Test health endpoints: curl http://localhost:5000/api/health');
    console.log('   3. Check metrics: curl http://localhost:9090/metrics');
    console.log('   4. Monitor logs: tail -f logs/app.log');
  }
}

// Run setup
if (require.main === module) {
  const setup = new MonitoringSetup();
  setup.run().catch(console.error);
}

module.exports = MonitoringSetup;

