#!/usr/bin/env node

/**
 * PostgreSQL Setup Script
 * Database tablolarını oluşturur ve gerekli yapılandırmaları yapar
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query, initializeDatabase, closePool } from '../database/postgres-connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  try {
    console.log('🗄️  Setting up PostgreSQL database...\n');
    
    // Read schema file
    const schemaPath = join(__dirname, '..', 'database', 'real_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      process.exit(1);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        await query(statement);
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Processed ${i + 1}/${statements.length} statements...`);
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('duplicate_object')) {
          // Silent skip
        } else {
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Database setup completed!');
    
    // Verify tables
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup error:', error);
    await closePool();
    process.exit(1);
  }
}

setupDatabase();
































































