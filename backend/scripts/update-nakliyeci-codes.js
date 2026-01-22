// Script to update existing nakliyeci users with nakliyeciCode
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext'
});

async function updateNakliyeciCodes() {
  try {
    console.log('🔄 Updating nakliyeci codes for existing users...\n');

    // Get all nakliyeci users without codes
    const result = await pool.query(
      `SELECT id, email, "fullName", "nakliyeciCode" 
       FROM users 
       WHERE role = 'nakliyeci' AND ("nakliyeciCode" IS NULL OR "nakliyeciCode" = '')`
    );

    console.log(`Found ${result.rows.length} nakliyeci users without codes\n`);

    for (const user of result.rows) {
      const maxAttempts = 20;
      let attempts = 0;
      let updateSuccess = false;
      let finalCode = null;

      // Use transaction for atomic operation
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        while (!updateSuccess && attempts < maxAttempts) {
          // Generate random 5-digit number (10000-99999)
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          finalCode = `YN-${randomNum}`;
          
          try {
            // Try to update user with this code
            const updateResult = await client.query(
              `UPDATE users SET "nakliyeciCode" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
              [finalCode, user.id]
            );
            
            if (updateResult.rowCount > 0) {
              updateSuccess = true;
              console.log(`✅ Updated ${user.email} (ID: ${user.id}) with code: ${finalCode} (attempt ${attempts + 1})`);
            } else {
              // User not found or already has code, skip
              updateSuccess = true;
              console.log(`⚠️ User ${user.email} (ID: ${user.id}) not found or already has code, skipping`);
            }
          } catch (updateError) {
            // Check if error is due to unique constraint violation (nakliyeciCode)
            if (updateError.code === '23505' && updateError.constraint && updateError.constraint.includes('nakliyeciCode')) {
              // Code already exists, try again with new random number
              attempts++;
              console.log(`⚠️ NakliyeciCode ${finalCode} already exists, generating new code (attempt ${attempts})`);
              continue;
            } else {
              // Other database error, rollback and throw
              await client.query('ROLLBACK');
              throw updateError;
            }
          }
        }
        
        if (!updateSuccess) {
          await client.query('ROLLBACK');
          console.error(`❌ Failed to generate unique nakliyeciCode for ${user.email} (ID: ${user.id}) after ${maxAttempts} attempts`);
        } else {
          await client.query('COMMIT');
        }
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error updating user ${user.email} (ID: ${user.id}):`, error.message);
      } finally {
        client.release();
      }
    }

    // Update demo nakliyeci with fixed code
    await pool.query(
      `UPDATE users SET "nakliyeciCode" = 'YN-10003', "updatedAt" = CURRENT_TIMESTAMP WHERE id = 1003 AND role = 'nakliyeci'`
    );
    console.log(`✅ Updated demo nakliyeci (ID: 1003) with code: YN-10003\n`);

    console.log('✅ All nakliyeci codes updated successfully!');

  } catch (error) {
    console.error('❌ Error updating nakliyeci codes:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateNakliyeciCodes();

