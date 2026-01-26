// Database initialization functions
async function createTables(pool) {
  if (!pool) {
    console.error('❌ No database pool available');
    return false;
  }

  try {
    // If a previous run created a UUID-based schema (from SQL migrations),
    // it will conflict with this runtime schema (integer PKs).
    // In development, self-heal by dropping the legacy UUID schema tables.
    try {
      const idColRes = await pool.query(
        `SELECT data_type, udt_name
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
         LIMIT 1`
      );
      const usersIdType = idColRes.rows?.[0]?.data_type || '';
      const usersIdUdt = idColRes.rows?.[0]?.udt_name || '';
      const isUuidUsers =
        String(usersIdType).toLowerCase() === 'uuid' || String(usersIdUdt).toLowerCase() === 'uuid';

      if (isUuidUsers) {
        console.warn(
          '⚠️ Detected UUID-based users.id. Resetting legacy UUID schema (development self-heal)...'
        );
        await pool.query(`
          DROP TABLE IF EXISTS
            commissions,
            cities,
            ratings,
            transactions,
            wallets,
            tracking_updates,
            notifications,
            messages,
            agreements,
            offers,
            shipments,
            users,
            migrations
          CASCADE
        `);
      }
    } catch (_) {
      // ignore (fresh DB)
    }

    // Canonical schema version (runtime)
    const CANONICAL_SCHEMA_VERSION = 'runtime_v1';

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100),
        lastName VARCHAR(100),
        fullName VARCHAR(255),
        role VARCHAR(50) DEFAULT 'individual',
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        district VARCHAR(100),
        companyName VARCHAR(255),
        taxNumber VARCHAR(50),
        taxOffice VARCHAR(100),
        isVerified BOOLEAN DEFAULT false,
        isEmailVerified BOOLEAN DEFAULT false,
        isPhoneVerified BOOLEAN DEFAULT false,
        isActive BOOLEAN DEFAULT true,
        avatarUrl TEXT,
        verificationDocuments JSONB,
        settings JSONB,
        lastLogin TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Forward-compatible ALTERs for users.
    // IMPORTANT: Many queries use quoted camelCase columns like u."fullName".
    // Unquoted CREATE TABLE turns them into lowercase (fullname), so we add the quoted versions and backfill.
    try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(100)'); } catch (_) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(100)'); } catch (_) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "fullName" VARCHAR(255)'); } catch (_) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "companyName" VARCHAR(255)'); } catch (_) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "taxNumber" VARCHAR(50)'); } catch (_) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "taxOffice" VARCHAR(100)'); } catch (_) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true'); } catch (_) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP'); } catch (_) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP'); } catch (_) {}

    // Backfill quoted columns from lowercase ones (created by unquoted schema).
    // Use COALESCE so we don't overwrite real data.
    try { await pool.query('UPDATE users SET "firstName" = COALESCE("firstName", firstname)'); } catch (_) {}
    try { await pool.query('UPDATE users SET "lastName" = COALESCE("lastName", lastname)'); } catch (_) {}
    try { await pool.query('UPDATE users SET "fullName" = COALESCE("fullName", fullname)'); } catch (_) {}
    try { await pool.query('UPDATE users SET "companyName" = COALESCE("companyName", companyname)'); } catch (_) {}
    try { await pool.query('UPDATE users SET "taxNumber" = COALESCE("taxNumber", taxnumber)'); } catch (_) {}
    try { await pool.query('UPDATE users SET "taxOffice" = COALESCE("taxOffice", taxoffice)'); } catch (_) {}
    try { await pool.query('UPDATE users SET "isActive" = COALESCE("isActive", isactive)'); } catch (_) {}
    try { await pool.query('UPDATE users SET "createdAt" = COALESCE("createdAt", createdat)'); } catch (_) {}
    try { await pool.query('UPDATE users SET "updatedAt" = COALESCE("updatedAt", updatedat)'); } catch (_) {}

    // Additional optional columns
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "nakliyeciCode" VARCHAR(50)');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "driverCode" VARCHAR(50)');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS users_nakliyeci_code_uq ON users ("nakliyeciCode")');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS users_driver_code_uq ON users ("driverCode")');
    } catch (_) {
      // ignore
    }

    // Schema version table (fail-fast drift protection)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_version (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) UNIQUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Corporate favorite carriers table (Kurumsal -> Favori Nakliyeci)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS corporate_carriers (
        id SERIAL PRIMARY KEY,
        corporate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        nakliyeci_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (corporate_id, nakliyeci_id)
      )
    `);

    // Forward-compatible ALTERs for corporate_carriers
    try {
      await pool.query('ALTER TABLE corporate_carriers ADD COLUMN IF NOT EXISTS corporate_id INTEGER');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('ALTER TABLE corporate_carriers ADD COLUMN IF NOT EXISTS nakliyeci_id INTEGER');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('ALTER TABLE corporate_carriers ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('ALTER TABLE corporate_carriers ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS corporate_carriers_uq ON corporate_carriers (corporate_id, nakliyeci_id)');
    } catch (_) {
      // ignore
    }

    // Ensure canonical version is recorded (do not change existing version automatically)
    try {
      const verRes = await pool.query('SELECT version FROM schema_version ORDER BY id DESC LIMIT 1');
      const current = verRes.rows && verRes.rows[0] ? verRes.rows[0].version : null;
      if (!current) {
        await pool.query('INSERT INTO schema_version(version) VALUES ($1)', [CANONICAL_SCHEMA_VERSION]);
      }
    } catch (_) {
      // ignore
    }

    // Shipments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        subCategory VARCHAR(50),
        pickupCity VARCHAR(100) NOT NULL,
        pickupDistrict VARCHAR(100),
        pickupAddress TEXT NOT NULL,
        pickupDate DATE,
        pickupTime TIME,
        deliveryCity VARCHAR(100) NOT NULL,
        deliveryDistrict VARCHAR(100),
        deliveryAddress TEXT NOT NULL,
        deliveryDate DATE,
        deliveryTime TIME,
        weight DECIMAL(10,2),
        volume DECIMAL(10,2),
        dimensions TEXT,
        value DECIMAL(10,2),
        requiresInsurance BOOLEAN DEFAULT false,
        specialRequirements TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        price DECIMAL(10,2),
        acceptedOfferId INTEGER,
        carrierId INTEGER REFERENCES users(id),
        driverId INTEGER REFERENCES users(id),
        trackingNumber VARCHAR(50),
        actualPickupDate TIMESTAMP,
        actualDeliveryDate TIMESTAMP,
        metadata JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Forward-compatible ALTERs (canonical columns must exist even on older DBs)
    try {
      await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS "driverId" INTEGER');
    } catch (_) {
      // ignore
    }

    // Legacy/compatibility: some routes still use driver_id (snake_case)
    try {
      await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS driver_id INTEGER');
    } catch (_) {
      // ignore
    }

    try {
      await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS "userId" INTEGER');
    } catch (_) {
      // ignore
    }

    try {
      await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS "carrierId" INTEGER');
    } catch (_) {
      // ignore
    }

    try {
      await pool.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    } catch (_) {
      // ignore
    }

    // Backfill canonical columns from legacy ones when possible
    try {
      const shipColsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments'`
      );
      const shipCols = new Set((shipColsRes.rows || []).map(r => r.column_name));

      if (shipCols.has('user_id')) {
        await pool.query('UPDATE shipments SET "userId" = user_id WHERE "userId" IS NULL');
      }
      if (shipCols.has('owner_id')) {
        await pool.query('UPDATE shipments SET "userId" = owner_id WHERE "userId" IS NULL');
      }

      if (shipCols.has('nakliyeci_id')) {
        await pool.query('UPDATE shipments SET "carrierId" = nakliyeci_id WHERE "carrierId" IS NULL');
      }
      if (shipCols.has('carrier_id')) {
        await pool.query('UPDATE shipments SET "carrierId" = carrier_id WHERE "carrierId" IS NULL');
      }

      // Backfill driver_id from any existing driver columns
      if (shipCols.has('driverid')) {
        await pool.query('UPDATE shipments SET driver_id = driverid WHERE driver_id IS NULL');
      }
      if (shipCols.has('driverId')) {
        await pool.query('UPDATE shipments SET driver_id = "driverId" WHERE driver_id IS NULL');
      }
    } catch (_) {
      // ignore
    }

    // Offers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        carrierId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        price DECIMAL(10,2) NOT NULL,
        message TEXT,
        estimatedDelivery DATE,
        estimatedDuration INTEGER,
        specialNotes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        expiresAt TIMESTAMP,
        isCounterOffer BOOLEAN DEFAULT false,
        parentOfferId INTEGER REFERENCES offers(id),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Forward-compatible ALTERs + backfill for offers
    try {
      await pool.query('ALTER TABLE offers ADD COLUMN IF NOT EXISTS "shipmentId" INTEGER');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('ALTER TABLE offers ADD COLUMN IF NOT EXISTS "carrierId" INTEGER');
    } catch (_) {
      // ignore
    }
    // RoutePlanner / driver-targeted offers (optional)
    try {
      const offerColsResForDriver = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'offers'`
      );
      const offerColsForDriver = new Set((offerColsResForDriver.rows || []).map(r => r.column_name));
      const hasDriverCol =
        offerColsForDriver.has('driverId') ||
        offerColsForDriver.has('driver_id') ||
        offerColsForDriver.has('driverid');
      if (!hasDriverCol) {
        await pool.query('ALTER TABLE offers ADD COLUMN IF NOT EXISTS "driverId" INTEGER');
      }
    } catch (_) {
      // ignore
    }
    try {
      const offerColsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'offers'`
      );
      const offerCols = new Set((offerColsRes.rows || []).map(r => r.column_name));
      if (offerCols.has('shipment_id')) {
        await pool.query('UPDATE offers SET "shipmentId" = shipment_id WHERE "shipmentId" IS NULL');
      }
      if (offerCols.has('userId')) {
        await pool.query('UPDATE offers SET "carrierId" = "userId" WHERE "carrierId" IS NULL');
      }
      if (offerCols.has('user_id')) {
        await pool.query('UPDATE offers SET "carrierId" = user_id WHERE "carrierId" IS NULL');
      }
      if (offerCols.has('carrier_id')) {
        await pool.query('UPDATE offers SET "carrierId" = carrier_id WHERE "carrierId" IS NULL');
      }
      if (offerCols.has('nakliyeci_id')) {
        await pool.query('UPDATE offers SET "carrierId" = nakliyeci_id WHERE "carrierId" IS NULL');
      }
    } catch (_) {
      // ignore
    }

    // Carrier Market Listings (Nakliyeci opens listing for drivers/taşıyıcı)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carrier_market_listings (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        nakliyeciId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        minPrice DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'open',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (shipmentId, nakliyeciId)
      )
    `);

    // Carrier Market Bids (Taşıyıcı bids on a listing)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carrier_market_bids (
        id SERIAL PRIMARY KEY,
        listingId INTEGER REFERENCES carrier_market_listings(id) ON DELETE CASCADE,
        carrierId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        bidPrice DECIMAL(10,2) NOT NULL,
        etaHours INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (listingId, carrierId)
      )
    `);

    // Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        senderId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiverId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        messageType VARCHAR(20) DEFAULT 'text',
        isRead BOOLEAN DEFAULT false,
        readAt TIMESTAMP,
        attachments JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Forward-compatible ALTERs + backfill for messages
    try {
      await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "shipmentId" INTEGER');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "senderId" INTEGER');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "receiverId" INTEGER');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS message TEXT');
    } catch (_) {
      // ignore
    }
    try {
      const msgColsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'messages'`
      );
      const msgCols = new Set((msgColsRes.rows || []).map(r => r.column_name));
      if (msgCols.has('shipment_id')) {
        await pool.query('UPDATE messages SET "shipmentId" = shipment_id WHERE "shipmentId" IS NULL');
      }
      if (msgCols.has('sender_id')) {
        await pool.query('UPDATE messages SET "senderId" = sender_id WHERE "senderId" IS NULL');
      }
      if (msgCols.has('receiver_id')) {
        await pool.query('UPDATE messages SET "receiverId" = receiver_id WHERE "receiverId" IS NULL');
      }
      if (msgCols.has('content')) {
        await pool.query('UPDATE messages SET message = content WHERE message IS NULL');
      }
    } catch (_) {
      // ignore
    }

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        linkUrl TEXT,
        isRead BOOLEAN DEFAULT false,
        readAt TIMESTAMP,
        priority VARCHAR(20) DEFAULT 'normal',
        category VARCHAR(50),
        metadata JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Forward-compatible ALTERs + backfill for notifications
    try {
      await pool.query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "userId" INTEGER');
    } catch (_) {
      // ignore
    }
    try {
      const notifColsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications'`
      );
      const notifCols = new Set((notifColsRes.rows || []).map(r => r.column_name));
      if (notifCols.has('user_id')) {
        await pool.query('UPDATE notifications SET "userId" = user_id WHERE "userId" IS NULL');
      }
      if (notifCols.has('userid')) {
        await pool.query('UPDATE notifications SET "userId" = userid WHERE "userId" IS NULL');
      }
    } catch (_) {
      // ignore
    }

    // Support Center (Help & Tickets)
    // NOTE: These are core tables required by `backend/routes/v1/support.js`.
    // They are intentionally created empty (no seed/mock data).
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        expected_response_time_hours INTEGER DEFAULT 24,
        auto_response_template TEXT,
        parent_id INTEGER REFERENCES support_categories(id) ON DELETE SET NULL,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user_type VARCHAR(50),
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        user_phone VARCHAR(50),
        category VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'open',
        subject VARCHAR(500),
        description TEXT,
        related_shipment_id INTEGER,
        related_offer_id INTEGER,
        related_transaction_id INTEGER,
        browser_info TEXT,
        url_context TEXT,
        assigned_admin_id INTEGER,
        first_response_at TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL,
        sender_id INTEGER,
        sender_name VARCHAR(255),
        message_content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'message',
        is_internal BOOLEAN DEFAULT false,
        is_auto_generated BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_attachments (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
        message_id INTEGER REFERENCES support_ticket_messages(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255),
        file_size INTEGER,
        file_type VARCHAR(100),
        file_path TEXT,
        uploaded_by_id INTEGER,
        uploaded_by_type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_support_references (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        support_reference_code VARCHAR(50) UNIQUE,
        phone_verification_code VARCHAR(10),
        total_tickets INTEGER DEFAULT 0,
        resolved_tickets INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin Flags (needed by admin panel)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_flags (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        target_type VARCHAR(20) NOT NULL,
        target_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_by INTEGER NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_admin_flags_status ON admin_flags(status)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_admin_flags_target ON admin_flags(target_type, target_id)");
    } catch (_) {
      // ignore
    }

    // Trust & Safety (Complaints + Disputes + Suspicious Activities)
    // These tables back `/api/complaints`, `/api/disputes`, `/api/suspicious-activity` and admin views.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        shipment_id INTEGER REFERENCES shipments(id) ON DELETE SET NULL,
        type VARCHAR(50),
        title TEXT,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        attachments JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_complaints_related_user ON complaints(related_user_id)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_complaints_shipment ON complaints(shipment_id)");
    } catch (_) {
      // ignore
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS disputes (
        id SERIAL PRIMARY KEY,
        dispute_ref VARCHAR(50) UNIQUE NOT NULL,
        shipment_id INTEGER REFERENCES shipments(id) ON DELETE SET NULL,
        complainant_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        respondent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        dispute_type VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        amount DECIMAL(10,2) DEFAULT 0,
        priority VARCHAR(20) DEFAULT 'low',
        status VARCHAR(20) DEFAULT 'pending',
        evidence_urls JSONB,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        resolution_notes TEXT,
        resolution_amount DECIMAL(10,2),
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_disputes_shipment ON disputes(shipment_id)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_disputes_users ON disputes(complainant_id, respondent_id)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_disputes_assigned_to ON disputes(assigned_to)");
    } catch (_) {
      // ignore
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS dispute_activities (
        id SERIAL PRIMARY KEY,
        dispute_id INTEGER REFERENCES disputes(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        description TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_dispute_activities_dispute ON dispute_activities(dispute_id)");
    } catch (_) {
      // ignore
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS dispute_messages (
        id SERIAL PRIMARY KEY,
        dispute_id INTEGER REFERENCES disputes(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        attachments JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id)");
    } catch (_) {
      // ignore
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS suspicious_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        risk_level VARCHAR(20) NOT NULL,
        details TEXT,
        status VARCHAR(20) DEFAULT 'active',
        resolution_notes TEXT,
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_suspicious_activities_status ON suspicious_activities(status)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user ON suspicious_activities(user_id)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_suspicious_activities_risk ON suspicious_activities(risk_level)");
    } catch (_) {
      // ignore
    }

    // Product Analytics (events + client metrics)
    // Used by `backend/routes/v1/analytics.js` and `src/services/businessAnalytics.ts`.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event VARCHAR(100) NOT NULL,
        ts BIGINT,
        path TEXT,
        href TEXT,
        referrer TEXT,
        ua TEXT,
        ip TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        role VARCHAR(50),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id)");
    } catch (_) {
      // ignore
    }
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at)");
    } catch (_) {
      // ignore
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_metrics (
        id SERIAL PRIMARY KEY,
        ts BIGINT,
        path TEXT,
        href TEXT,
        ua TEXT,
        ip TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        role VARCHAR(50),
        metrics JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_analytics_metrics_created_at ON analytics_metrics(created_at)");
    } catch (_) {
      // ignore
    }

    // Tracking updates table (for live tracking timeline)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tracking_updates (
        id SERIAL PRIMARY KEY,
        shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        notes TEXT,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        carrierId INTEGER REFERENCES users(id),
        offerId INTEGER REFERENCES offers(id),
        amount DECIMAL(10,2) NOT NULL,
        commission DECIMAL(10,2) DEFAULT 0,
        paymentType VARCHAR(50) DEFAULT 'escrow',
        status VARCHAR(50) DEFAULT 'pending',
        paymentMethod VARCHAR(50),
        transactionId VARCHAR(255),
        paidAt TIMESTAMP,
        releasedAt TIMESTAMP,
        refundedAt TIMESTAMP,
        metadata JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        shipmentId INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
        raterId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ratedId INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        category VARCHAR(50),
        isVisible BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(shipmentId, raterId, ratedId)
      )
    `);

    // Email verification tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        userid INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Backward/forward compatibility: ensure a usable user id column exists
    try {
      await pool.query('ALTER TABLE email_verification_tokens ADD COLUMN IF NOT EXISTS userId INTEGER');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('ALTER TABLE email_verification_tokens ADD COLUMN IF NOT EXISTS user_id INTEGER');
    } catch (_) {
      // ignore
    }

    // Phone verification codes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS phone_verification_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT false,
        attempts INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes (schema-aware: support snake_case vs camelCase)
    const getCols = async (table) => {
      try {
        const r = await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
          [table]
        );
        return new Set((r.rows || []).map(x => x.column_name));
      } catch (_) {
        return new Set();
      }
    };

    const pickCol = (cols, ...names) => names.find(n => cols.has(n)) || null;

    const shipmentsCols = await getCols('shipments');
    const offersCols = await getCols('offers');
    const messagesCols = await getCols('messages');
    const notificationsCols = await getCols('notifications');
    const cmlCols = await getCols('carrier_market_listings');
    const cmbCols = await getCols('carrier_market_bids');

    const shipmentsUserCol = pickCol(shipmentsCols, 'userId', 'user_id', 'ownerId', 'owner_id');
    const offersShipmentCol = pickCol(offersCols, 'shipmentId', 'shipment_id');
    const offersCarrierCol = pickCol(offersCols, 'carrierId', 'carrier_id', 'nakliyeci_id');
    const messagesSenderCol = pickCol(messagesCols, 'senderId', 'sender_id');
    const messagesReceiverCol = pickCol(messagesCols, 'receiverId', 'receiver_id');
    const notificationsUserCol = pickCol(notificationsCols, 'userId', 'user_id', 'userid');

    const cmlShipmentCol = pickCol(cmlCols, 'shipmentId', 'shipment_id', 'shipmentid');
    const cmlNakliyeciCol = pickCol(
      cmlCols,
      'createdByCarrierId',
      'created_by_carrier_id',
      'nakliyeciId',
      'nakliyeci_id',
      'carrierId',
      'carrier_id'
    );
    const cmbListingCol = pickCol(cmbCols, 'listingId', 'listing_id', 'listingid');
    const cmbCarrierCol = pickCol(
      cmbCols,
      'bidderCarrierId',
      'bidder_carrier_id',
      'carrierId',
      'carrier_id',
      'userId',
      'user_id'
    );

    const createIndex = async (name, table, col) => {
      if (!col) return;
      const colExpr = /[A-Z]/.test(col) ? `"${col}"` : col;
      try {
        await pool.query(`CREATE INDEX IF NOT EXISTS ${name} ON ${table}(${colExpr})`);
      } catch (_) {
        // ignore
      }
    };

    await createIndex('idx_shipments_user', 'shipments', shipmentsUserCol);
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)');
    } catch (_) {
      // ignore
    }
    await createIndex('idx_offers_shipment', 'offers', offersShipmentCol);
    await createIndex('idx_offers_carrier', 'offers', offersCarrierCol);
    await createIndex('idx_messages_sender', 'messages', messagesSenderCol);
    await createIndex('idx_messages_receiver', 'messages', messagesReceiverCol);
    await createIndex('idx_notifications_user', 'notifications', notificationsUserCol);

    // Carrier market unique constraints for safe UPSERT (ON CONFLICT)
    const qIdent = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);
    try {
      if (cmlShipmentCol && cmlNakliyeciCol) {
        // Deduplicate rows to allow creating UNIQUE constraints/indexes
        try {
          await pool.query(
            `WITH ranked AS (
               SELECT id,
                      ROW_NUMBER() OVER (
                        PARTITION BY ${qIdent(cmlShipmentCol)}, ${qIdent(cmlNakliyeciCol)}
                        ORDER BY id DESC
                      ) AS rn
               FROM carrier_market_listings
             )
             DELETE FROM carrier_market_listings
             WHERE id IN (SELECT id FROM ranked WHERE rn > 1)`
          );
        } catch (_) {
          // ignore
        }

        await pool.query(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_cml_unique_shipment_nakliyeci ON carrier_market_listings(${qIdent(
            cmlShipmentCol
          )}, ${qIdent(cmlNakliyeciCol)})`
        );

        try {
          const cName = 'uq_cml_shipment_carrier';
          const exists = await pool.query(
            `SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = 'carrier_market_listings'::regclass`,
            [cName]
          );
          if (!exists.rows || exists.rows.length === 0) {
            await pool.query(
              `ALTER TABLE carrier_market_listings ADD CONSTRAINT ${cName} UNIQUE (${qIdent(cmlShipmentCol)}, ${qIdent(
                cmlNakliyeciCol
              )})`
            );
          }
        } catch (_) {
          // ignore
        }
      }
    } catch (_) {
      // ignore
    }
    try {
      if (cmbListingCol && cmbCarrierCol) {
        // Deduplicate rows to allow creating UNIQUE constraints/indexes
        try {
          await pool.query(
            `WITH ranked AS (
               SELECT id,
                      ROW_NUMBER() OVER (
                        PARTITION BY ${qIdent(cmbListingCol)}, ${qIdent(cmbCarrierCol)}
                        ORDER BY id DESC
                      ) AS rn
               FROM carrier_market_bids
             )
             DELETE FROM carrier_market_bids
             WHERE id IN (SELECT id FROM ranked WHERE rn > 1)`
          );
        } catch (_) {
          // ignore
        }

        await pool.query(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_cmb_unique_listing_carrier ON carrier_market_bids(${qIdent(
            cmbListingCol
          )}, ${qIdent(cmbCarrierCol)})`
        );

        try {
          const cName = 'uq_cmb_listing_carrier';
          const exists = await pool.query(
            `SELECT 1 FROM pg_constraint WHERE conname = $1 AND conrelid = 'carrier_market_bids'::regclass`,
            [cName]
          );
          if (!exists.rows || exists.rows.length === 0) {
            await pool.query(
              `ALTER TABLE carrier_market_bids ADD CONSTRAINT ${cName} UNIQUE (${qIdent(cmbListingCol)}, ${qIdent(
                cmbCarrierCol
              )})`
            );
          }
        } catch (_) {
          // ignore
        }
      }
    } catch (_) {
      // ignore
    }

    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_tracking_updates_shipment_id ON tracking_updates(shipment_id)');
    } catch (_) {
      // ignore
    }
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_tracking_updates_created_at ON tracking_updates(created_at)');
    } catch (_) {
      // ignore
    }

    // Fail-fast canonical schema validation: core columns must exist
    try {
      const mustHave = {
        users: ['id', 'email', 'role'],
        shipments: ['id', 'userId', 'status', 'carrierId', 'driverId'],
        offers: ['id', 'shipmentId', 'carrierId', 'status'],
        messages: ['id', 'shipmentId', 'senderId', 'receiverId', 'message'],
        notifications: ['id', 'userId', 'type', 'title', 'message'],
      };

      for (const [table, cols] of Object.entries(mustHave)) {
        const cRes = await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
          [table]
        );
        const set = new Set((cRes.rows || []).map(r => r.column_name));
        const missing = cols.filter(c => !set.has(c));
        if (missing.length) {
          throw new Error(`Schema drift detected: table ${table} missing columns: ${missing.join(', ')}`);
        }
      }

      // Version sanity check (do not auto-mutate; fail if a different version is recorded)
      try {
        const vRes = await pool.query('SELECT version FROM schema_version ORDER BY id DESC LIMIT 1');
        const v = vRes.rows && vRes.rows[0] ? vRes.rows[0].version : null;
        if (v && v !== CANONICAL_SCHEMA_VERSION) {
          throw new Error(`Schema drift detected: schema_version=${v} expected=${CANONICAL_SCHEMA_VERSION}`);
        }
      } catch (e) {
        throw e;
      }
    } catch (e) {
      console.error('❌ Canonical schema validation failed:', e.message);
      console.error('❌ Fix: reset/migrate the database to the canonical runtime schema (backend/database/init.js).');
      throw e;
    }

    console.log('✅ PostgreSQL tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    return false;
  }
}

async function seedData(pool) {
  if (!pool) {
    console.error('❌ No database pool available for seeding');
    return false;
  }

  try {
    // Check if data already exists
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('✅ Data already exists, skipping seed');
      return true;
    }

    console.log('✅ Test data seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return false;
  }
}

module.exports = { createTables, seedData };

