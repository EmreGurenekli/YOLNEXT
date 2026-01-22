const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'yolnext',
  password: 'postgres',
  port: 5432,
});

async function checkDatabase() {
  try {
    console.log('=== VERİTABANI KONTROLÜ ===');
    
    // Tablo sayısı
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tablolar:', tables.rows.map(r => r.table_name));
    
    // Kullanıcı sayısı
    const users = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Toplam kullanıcı:', users.rows[0].count);
    
    // Gönderi sayısı
    const shipments = await pool.query('SELECT COUNT(*) as count FROM shipments');
    console.log('Toplam gönderi:', shipments.rows[0].count);
    
    // Teklif sayısı
    const offers = await pool.query('SELECT COUNT(*) as count FROM offers');
    console.log('Toplam teklif:', offers.rows[0].count);
    
    // Mesaj sayısı
    const messages = await pool.query('SELECT COUNT(*) as count FROM messages');
    console.log('Toplam mesaj:', messages.rows[0].count);
    
    // Cüzdan bakiyesi
    const wallets = await pool.query('SELECT SUM(balance) as total FROM wallets');
    console.log('Toplam cüzdan bakiyesi:', wallets.rows[0].total || 0);
    
    console.log('=== VERİ İÇERİK KONTROLÜ ===');
    
    // Son gönderiler
    const recentShipments = await pool.query(`
      SELECT id, tracking_number, status, pickup_address, delivery_address, created_at 
      FROM shipments ORDER BY created_at DESC LIMIT 5
    `);
    console.log('Son gönderiler:', recentShipments.rows);
    
    // Aktif teklifler
    const activeOffers = await pool.query(`
      SELECT o.id, o.price, o.status, s.tracking_number, u.email as user_email
      FROM offers o 
      JOIN shipments s ON o.shipment_id = s.id 
      JOIN users u ON o.user_id = u.id 
      WHERE o.status = 'pending' 
      ORDER BY o.created_at DESC LIMIT 5
    `);
    console.log('Aktif teklifler:', activeOffers.rows);
    
    console.log('=== VERİ TUTARLILIK KONTROLÜ ===');
    
    // Orphan records
    const orphanOffers = await pool.query(`
      SELECT COUNT(*) as count FROM offers o 
      LEFT JOIN shipments s ON o.shipment_id = s.id 
      WHERE s.id IS NULL
    `);
    console.log('Orphan teklifler:', orphanOffers.rows[0].count);
    
    const orphanMessages = await pool.query(`
      SELECT COUNT(*) as count FROM messages m 
      LEFT JOIN shipments s ON m.shipment_id = s.id 
      WHERE s.id IS NULL
    `);
    console.log('Orphan mesajlar:', orphanMessages.rows[0].count);
    
    // Duplicate tracking numbers
    const duplicateTracking = await pool.query(`
      SELECT tracking_number, COUNT(*) as count 
      FROM shipments 
      GROUP BY tracking_number 
      HAVING COUNT(*) > 1
    `);
    console.log('Duplicate takip numaraları:', duplicateTracking.rows);
    
    console.log('=== TEST SONU ===');
    
  } catch (error) {
    console.error('Veritabanı hatası:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
