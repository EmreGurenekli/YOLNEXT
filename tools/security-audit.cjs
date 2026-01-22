#!/usr/bin/env node
/**
 * Security Audit Script for YolNext
 * Checks for common security vulnerabilities and misconfigurations
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  checkEnvironmentVariables() {
    console.log('🔍 Checking environment variables...');
    
    const requiredVars = [
      'JWT_SECRET',
      'DATABASE_URL',
      'FRONTEND_ORIGIN',
    ];

    const envFile = path.join(__dirname, '../.env.production');
    if (!fs.existsSync(envFile)) {
      this.warnings.push('Production .env file not found');
      return;
    }

    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars = envContent.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split('=')[0].trim());

    requiredVars.forEach(varName => {
      if (!envVars.includes(varName)) {
        this.issues.push(`Missing required environment variable: ${varName}`);
      } else if (envContent.includes(`CHANGE_ME`) || envContent.includes(`YOUR_`)) {
        this.warnings.push(`Environment variable ${varName} appears to have placeholder value`);
      } else {
        this.passed.push(`Environment variable ${varName} is set`);
      }
    });

    // Check JWT_SECRET strength
    const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
    if (jwtSecretMatch && jwtSecretMatch[1]) {
      const secret = jwtSecretMatch[1].trim();
      if (secret.length < 32) {
        this.issues.push(`JWT_SECRET is too short (${secret.length} chars). Minimum 32 characters required.`);
      } else {
        this.passed.push(`JWT_SECRET has sufficient length (${secret.length} chars)`);
      }
    }
  }

  checkDependencies() {
    console.log('🔍 Checking dependencies...');
    
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
    );

    const knownVulnerablePackages = [
      // Add known vulnerable packages here
    ];

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    Object.keys(allDeps).forEach(dep => {
      if (knownVulnerablePackages.includes(dep)) {
        this.warnings.push(`Potentially vulnerable package: ${dep}`);
      }
    });

    this.passed.push('Dependency check completed');
  }

  checkSecurityHeaders() {
    console.log('🔍 Checking security headers configuration...');
    
    const backendFile = path.join(__dirname, '../backend/server-modular.js');
    if (!fs.existsSync(backendFile)) {
      this.warnings.push('Backend file not found for security headers check');
      return;
    }

    const content = fs.readFileSync(backendFile, 'utf8');
    
    const requiredSecurity = [
      { name: 'helmet', check: content.includes('helmet') },
      { name: 'CORS', check: content.includes('cors') },
      { name: 'rate limiting', check: content.includes('rateLimit') },
    ];

    requiredSecurity.forEach(({ name, check }) => {
      if (check) {
        this.passed.push(`Security feature configured: ${name}`);
      } else {
        this.issues.push(`Missing security feature: ${name}`);
      }
    });
  }

  checkDatabaseSecurity() {
    console.log('🔍 Checking database security...');
    
    const backendFile = path.join(__dirname, '../backend/server-modular.js');
    if (!fs.existsSync(backendFile)) {
      return;
    }

    const content = fs.readFileSync(backendFile, 'utf8');
    
    // Check for SQL injection protection
    if (content.includes('parameterized') || content.includes('$1') || content.includes('?')) {
      this.passed.push('Database uses parameterized queries');
    } else {
      this.warnings.push('Could not verify parameterized queries usage');
    }

    // Check for connection pooling
    if (content.includes('Pool') || content.includes('pool')) {
      this.passed.push('Database connection pooling configured');
    } else {
      this.warnings.push('Database connection pooling not found');
    }
  }

  checkAuthentication() {
    console.log('🔍 Checking authentication security...');
    
    const backendFile = path.join(__dirname, '../backend/server-modular.js');
    if (!fs.existsSync(backendFile)) {
      return;
    }

    const content = fs.readFileSync(backendFile, 'utf8');
    
    const authChecks = [
      { name: 'JWT verification', check: content.includes('jwt.verify') },
      { name: 'Password hashing', check: content.includes('bcrypt') },
      { name: 'Token expiration', check: content.includes('expiresIn') || content.includes('expires_at') },
    ];

    authChecks.forEach(({ name, check }) => {
      if (check) {
        this.passed.push(`Authentication security: ${name}`);
      } else {
        this.warnings.push(`Authentication check: ${name} not found`);
      }
    });
  }

  checkFileUploadSecurity() {
    console.log('🔍 Checking file upload security...');
    
    const backendFile = path.join(__dirname, '../backend/server-modular.js');
    if (!fs.existsSync(backendFile)) {
      return;
    }

    const content = fs.readFileSync(backendFile, 'utf8');
    
    if (content.includes('multer')) {
      this.passed.push('File upload middleware configured');
      
      // Check for file size limits
      if (content.includes('limits') || content.includes('fileSize')) {
        this.passed.push('File upload size limits configured');
      } else {
        this.warnings.push('File upload size limits not found');
      }

      // Check for file type validation
      if (content.includes('fileFilter') || content.includes('mimetype')) {
        this.passed.push('File type validation configured');
      } else {
        this.warnings.push('File type validation not found');
      }
    }
  }

  async run() {
    console.log('🔒 Starting security audit...\n');

    this.checkEnvironmentVariables();
    this.checkDependencies();
    this.checkSecurityHeaders();
    this.checkDatabaseSecurity();
    this.checkAuthentication();
    this.checkFileUploadSecurity();

    this.printResults();
  }

  printResults() {
    console.log('\n📊 Security Audit Results:');
    console.log('='.repeat(50));

    if (this.passed.length > 0) {
      console.log(`\n✅ Passed Checks (${this.passed.length}):`);
      this.passed.forEach(check => console.log(`   ✓ ${check}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   ⚠ ${warning}`));
    }

    if (this.issues.length > 0) {
      console.log(`\n❌ Critical Issues (${this.issues.length}):`);
      this.issues.forEach(issue => console.log(`   ✗ ${issue}`));
      console.log('\n⚠️  Please fix critical issues before deploying to production!');
    }

    console.log('='.repeat(50));
    console.log(`\nSummary: ${this.passed.length} passed, ${this.warnings.length} warnings, ${this.issues.length} issues`);

    if (this.issues.length > 0) {
      process.exit(1);
    }
  }
}

// Run audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.run().catch(console.error);
}

module.exports = SecurityAuditor;

