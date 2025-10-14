const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection configuration
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: 'postgres' // Connect to default postgres database first
});

async function setupPostgreSQL() {
  try {
    console.log('🚀 PostgreSQL kurulumu başlıyor...\n');
    
    // 1. Connect to PostgreSQL
    await client.connect();
    console.log('✅ PostgreSQL sunucusuna bağlandı');
    
    // 2. Create database if not exists
    const dbName = process.env.DB_NAME || 'yolnet_db';
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`;
    const dbExists = await client.query(checkDbQuery);
    
    if (dbExists.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Veritabanı '${dbName}' oluşturuldu`);
    } else {
      console.log(`✅ Veritabanı '${dbName}' zaten mevcut`);
    }
    
    // 3. Close connection to default database
    await client.end();
    
    // 4. Connect to our database
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: dbName
    });
    
    await dbClient.connect();
    console.log(`✅ '${dbName}' veritabanına bağlandı`);
    
    // 5. Create tables using Sequelize
    console.log('📊 Tablolar oluşturuluyor...');
    const { sequelize, syncDatabase } = require('../models/index');
    
    await syncDatabase();
    console.log('✅ Tüm tablolar oluşturuldu');
    
    // 6. Insert sample data
    console.log('📝 Örnek veriler ekleniyor...');
    await insertSampleData(dbClient);
    
    await dbClient.end();
    console.log('\n🎉 PostgreSQL kurulumu tamamlandı!');
    console.log('📊 Veritabanı bilgileri:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    
  } catch (error) {
    console.error('❌ PostgreSQL kurulum hatası:', error.message);
    console.log('\n💡 Çözüm önerileri:');
    console.log('1. PostgreSQL kurulu olduğundan emin olun');
    console.log('2. PostgreSQL servisinin çalıştığından emin olun');
    console.log('3. Kullanıcı adı ve şifrenin doğru olduğundan emin olun');
    console.log('4. .env dosyasını kontrol edin');
  }
}

async function insertSampleData(client) {
  // Sample users
  const users = [
    {
      id: 1,
      first_name: 'Ahmet',
      last_name: 'Yılmaz',
      email: 'ahmet@demo.com',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.2', // password: demo123
      user_type: 'individual',
      phone: '+90 555 123 4567',
      is_active: true,
      is_verified: true
    },
    {
      id: 2,
      first_name: 'Fatma',
      last_name: 'Demir',
      email: 'fatma@demo.com',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.2',
      user_type: 'corporate',
      phone: '+90 555 234 5678',
      is_active: true,
      is_verified: true
    },
    {
      id: 3,
      first_name: 'Mehmet',
      last_name: 'Kaya',
      email: 'mehmet@demo.com',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.2',
      user_type: 'carrier',
      phone: '+90 555 345 6789',
      is_active: true,
      is_verified: true
    },
    {
      id: 4,
      first_name: 'Ayşe',
      last_name: 'Özkan',
      email: 'ayse@demo.com',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.2',
      user_type: 'driver',
      phone: '+90 555 456 7890',
      is_active: true,
      is_verified: true
    }
  ];

  // Insert users
  for (const user of users) {
    await client.query(`
      INSERT INTO users (id, first_name, last_name, email, password, user_type, phone, is_active, is_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [user.id, user.first_name, user.last_name, user.email, user.password, user.user_type, user.phone, user.is_active, user.is_verified]);
  }

  console.log('✅ Örnek kullanıcılar eklendi');

  // Sample shipments
  const shipments = [
    {
      id: 1,
      sender_id: 1,
      title: 'Ev Eşyaları Taşıma',
      origin_address: 'İstanbul, Kadıköy',
      destination_address: 'Ankara, Çankaya',
      pickup_date: '2024-01-20',
      delivery_date: '2024-01-22',
      description: '3+1 daire eşyaları, beyaz eşyalar dahil',
      status: 'pending',
      price: 2500.00,
      weight: 500,
      volume: 15.5,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      sender_id: 2,
      title: 'Ofis Mobilyaları',
      origin_address: 'İzmir, Konak',
      destination_address: 'Bursa, Osmangazi',
      pickup_date: '2024-01-21',
      delivery_date: '2024-01-23',
      description: 'Ofis masaları, sandalyeler, dosya dolapları',
      status: 'quoted',
      price: 1800.00,
      weight: 300,
      volume: 12.0,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // Insert shipments
  for (const shipment of shipments) {
    await client.query(`
      INSERT INTO shipments (id, sender_id, title, origin_address, destination_address, pickup_date, delivery_date, description, status, price, weight, volume, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO NOTHING
    `, [shipment.id, shipment.sender_id, shipment.title, shipment.origin_address, shipment.destination_address, shipment.pickup_date, shipment.delivery_date, shipment.description, shipment.status, shipment.price, shipment.weight, shipment.volume, shipment.created_at, shipment.updated_at]);
  }

  console.log('✅ Örnek gönderiler eklendi');
}

// Run setup if called directly
if (require.main === module) {
  setupPostgreSQL();
}

module.exports = { setupPostgreSQL };





