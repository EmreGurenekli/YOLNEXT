const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext',
  connectionTimeoutMillis: 10000,
});

async function createDemoTasiyici() {
  try {
    await pool.connect();
    console.log('✅ Database connected');

    // Check if demo tasiyici (ID 1004) exists
    const existingUser = await pool.query(
      'SELECT id, email, "driverCode" FROM users WHERE id = 1004'
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      console.log(`\n📋 Mevcut demo taşıyıcı bulundu:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   DriverCode: ${user.driverCode || 'YOK'}`);

      // If driverCode doesn't exist, generate one
      if (!user.driverCode) {
        let driverCode;
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          driverCode = `YD-${randomNum}`;

          const codeCheck = await pool.query(
            'SELECT id FROM users WHERE "driverCode" = $1',
            [driverCode]
          );

          if (codeCheck.rows.length === 0) {
            // Code is unique, update user
            await pool.query(
              'UPDATE users SET "driverCode" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = 1004',
              [driverCode]
            );
            console.log(`\n✅ Demo taşıyıcıya driverCode eklendi: ${driverCode}`);
            break;
          }
          attempts++;
        }

        if (attempts >= maxAttempts) {
          console.error('❌ Benzersiz driverCode oluşturulamadı');
        }
      } else {
        console.log(`\n✅ Demo taşıyıcının zaten bir driverCode'u var: ${user.driverCode}`);
      }
    } else {
      // Create new demo tasiyici
      console.log('\n📝 Yeni demo taşıyıcı oluşturuluyor...');

      const hashedPassword = await bcrypt.hash('Test123!', 10);
      let driverCode;
      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts) {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        driverCode = `YD-${randomNum}`;

        const codeCheck = await pool.query(
          'SELECT id FROM users WHERE "driverCode" = $1',
          [driverCode]
        );

        if (codeCheck.rows.length === 0) {
          // Code is unique, create user
          const result = await pool.query(
            `INSERT INTO users (id, email, password, "firstName", "lastName", "fullName", role, phone, "isActive", "driverCode", "createdAt", "updatedAt")
             VALUES (1004, $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id, email, "driverCode"`,
            [
              'demo.tasiyici@yolnext.com',
              hashedPassword,
              'Demo',
              'Taşıyıcı',
              'Demo Taşıyıcı',
              'tasiyici',
              '+90 555 000 0004',
              true,
              driverCode
            ]
          );

          console.log(`\n✅ Yeni demo taşıyıcı oluşturuldu:`);
          console.log(`   ID: ${result.rows[0].id}`);
          console.log(`   Email: ${result.rows[0].email}`);
          console.log(`   DriverCode: ${result.rows[0].driverCode}`);
          break;
        }
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.error('❌ Benzersiz driverCode oluşturulamadı');
      }
    }

    // Verify the demo tasiyici
    const verifyResult = await pool.query(
      'SELECT id, email, "fullName", role, "driverCode" FROM users WHERE id = 1004'
    );

    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log(`\n✅ Demo taşıyıcı hazır:`);
      console.log(JSON.stringify(user, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

createDemoTasiyici();












