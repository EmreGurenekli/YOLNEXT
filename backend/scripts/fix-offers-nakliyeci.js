// One-time script to ensure offers table has required columns/indexes
require('dotenv').config();
const { Pool } = require('pg');
const { getEnv } = require('../utils/envValidator');

async function run() {
  const pool = new Pool({
    connectionString: getEnv('DATABASE_URL', 'postgresql://postgres:2563@localhost:5432/yolnext'),
    ssl: false,
  });

  try {
    const alterOffers = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'offers' AND column_name = 'nakliyeci_id'
        ) THEN
          ALTER TABLE offers ADD COLUMN "nakliyeci_id" INTEGER REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `;

    const alterCarrier = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'offers' AND column_name = 'carrier_id'
        ) THEN
          ALTER TABLE offers ADD COLUMN "carrier_id" INTEGER REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `;

    const alterOwner = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'shipments' AND column_name = 'ownerId'
        ) THEN
          ALTER TABLE shipments ADD COLUMN "ownerId" INTEGER REFERENCES users(id);
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'shipments' AND column_name = 'user_id'
          ) THEN
            UPDATE shipments SET "ownerId" = "user_id" WHERE "ownerId" IS NULL;
          END IF;
        END IF;
      END $$;
    `;

    await pool.query(alterOwner);
    await pool.query(alterCarrier);
    await pool.query(alterOffers);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_offers_shipment ON offers("shipment_id")');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_offers_carrier ON offers("carrier_id")');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_shipments_owner ON shipments("ownerId")');

    console.log('✅ offers table columns/indexes ensured');
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('❌ fix-offers-nakliyeci failed:', err.message);
  process.exit(1);
});

