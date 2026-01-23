// Carrier market routes (driver marketplace for nakliyeci)
// Permanent implementation: uses carrier_market_listings and carrier_market_bids tables.

const express = require('express');

function createCarrierMarketRoutes(pool, authenticateToken, createNotification) {
  const router = express.Router();

  const resolveTable = async (tableName) => {
    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = $1
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`,
      [tableName]
    );
    const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = $2`,
      [tableName, schema]
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pickCol = (...names) => names.find(n => cols.has(n)) || null;
    const qCol = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);
    return { schema, cols, pickCol, qCol };
  };

  const getUsersCols = async () => {
    const { schema, cols, pickCol, qCol } = await resolveTable('users');
    return {
      schema,
      cols: {
        idCol: pickCol('id') || 'id',
        fullNameCol: pickCol('fullName', 'full_name', 'name') || null,
        companyNameCol: pickCol('companyName', 'company_name') || null,
        emailCol: pickCol('email', 'emailAddress', 'email_address', 'mail') || null,
        phoneCol: pickCol('phone', 'phone_number', 'phoneNumber', 'phonenumber') || null,
      },
      qCol,
    };
  };

  const getShipmentsCols = async () => {
    const { schema, cols, pickCol, qCol } = await resolveTable('shipments');
    return {
      schema,
      cols: {
        idCol: pickCol('id', 'shipment_id', 'shipmentId') || 'id',
        ownerCol: pickCol('owner_id', 'user_id', 'userId', 'userid'),
        carrierCol: pickCol('nakliyeci_id', 'carrier_id', 'carrierId', 'carrierid'),
        driverCol: pickCol('driver_id', 'driverId', 'driverid'),
        statusCol: pickCol('status'),
        priceCol: pickCol('price', 'offerPrice', 'offer_price'),
        titleCol: pickCol('title'),
        pickupCityCol: pickCol('pickupCity', 'pickup_city'),
        deliveryCityCol: pickCol('deliveryCity', 'delivery_city'),
        pickupAddressCol: pickCol('pickupAddress', 'pickup_address', 'from_address'),
        deliveryAddressCol: pickCol('deliveryAddress', 'delivery_address', 'to_address'),
        weightCol: pickCol('weight'),
        volumeCol: pickCol('volume'),
        metadataCol: pickCol('metadata'),
        updatedAtCol: pickCol('updatedAt', 'updated_at', 'updatedat'),
      },
      qCol,
      availableColumns: Array.from(cols),
    };
  };

  const getListingsCols = async () => {
    const { schema, cols, pickCol, qCol } = await resolveTable('carrier_market_listings');
    return {
      schema,
      cols: {
        idCol: pickCol('id'),
        shipmentIdCol: pickCol('shipment_id', 'shipmentId', 'shipmentid'),
        nakliyeciIdCol: pickCol(
          'nakliyeci_id',
          'nakliyeciId',
          'nakliyeciid',
          'createdByCarrierId',
          'created_by_carrier_id',
          'carrier_id',
          'carrierId',
          'carrierid'
        ),
        minPriceCol: pickCol('min_price', 'minPrice', 'minprice'),
        statusCol: pickCol('status'),
        createdAtCol: pickCol('created_at', 'createdAt', 'createdat'),
        updatedAtCol: pickCol('updated_at', 'updatedAt', 'updatedat'),
      },
      qCol,
      availableColumns: Array.from(cols),
    };
  };

  const getBidsCols = async () => {
    const { schema, cols, pickCol, qCol } = await resolveTable('carrier_market_bids');
    return {
      schema,
      cols: {
        idCol: pickCol('id'),
        listingIdCol: pickCol('listing_id', 'listingId', 'listingid'),
        carrierIdCol: pickCol(
          'carrier_id',
          'carrierId',
          'carrierid',
          'bidderCarrierId',
          'bidder_carrier_id',
          'user_id',
          'userId',
          'userid'
        ),
        bidPriceCol: pickCol('bid_price', 'bidPrice', 'bidprice', 'price'),
        etaHoursCol: pickCol('eta_hours', 'etaHours', 'etahours'),
        statusCol: pickCol('status'),
        createdAtCol: pickCol('created_at', 'createdAt', 'createdat'),
        updatedAtCol: pickCol('updated_at', 'updatedAt', 'updatedat'),
      },
      qCol,
      availableColumns: Array.from(cols),
    };
  };

  router.get('/_meta', async (_req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, module: 'carrierMarket', loaded: false, message: 'Database not available' });
      }
      const [ship, listings, bids] = await Promise.all([getShipmentsCols(), getListingsCols(), getBidsCols()]);
      return res.json({
        success: true,
        module: 'carrierMarket',
        loaded: true,
        ts: new Date().toISOString(),
        detected: { ship, listings, bids },
      });
    } catch (e) {
      return res.status(500).json({ success: false, module: 'carrierMarket', loaded: false, message: e.message });
    }
  });

  const ensurePool = (res) => {
    if (!pool) {
      res.status(500).json({ success: false, message: 'Database not available' });
      return false;
    }
    return true;
  };



  // Create/open a listing for drivers (broadcast)
  router.post('/listings', authenticateToken, async (req, res) => {
    try {
      if (!ensurePool(res)) return;

      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

      // Only nakliyeci should open driver listings
      if (role && role !== 'nakliyeci') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const shipmentId = Number(req.body?.shipmentId);
      const minPrice = req.body?.minPrice != null ? Number(req.body.minPrice) : null;
      if (!shipmentId) {
        return res.status(400).json({ success: false, message: 'shipmentId gerekli' });
      }

      const ship = await getShipmentsCols();
      const shipIdExpr = ship.qCol(ship.cols.idCol);
      const shipCarrierExpr = ship.cols.carrierCol ? ship.qCol(ship.cols.carrierCol) : null;
      const shipDriverExpr = ship.cols.driverCol ? ship.qCol(ship.cols.driverCol) : null;

      const shipSel = `SELECT ${shipIdExpr} as id${shipCarrierExpr ? `, ${shipCarrierExpr} as carrier_id` : ''}${shipDriverExpr ? `, ${shipDriverExpr} as driver_id` : ''} FROM "${ship.schema}".shipments WHERE ${shipIdExpr} = $1`;
      const shipRes = await pool.query(shipSel, [shipmentId]);
      const shipRow = shipRes.rows && shipRes.rows[0] ? shipRes.rows[0] : null;
      if (!shipRow) return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });

      if (shipCarrierExpr && shipRow.carrier_id != null && String(shipRow.carrier_id) !== String(userId)) {
        return res.status(403).json({ success: false, message: 'Bu gönderi için ilan açamazsınız' });
      }
      if (shipDriverExpr && shipRow.driver_id != null) {
        return res.status(409).json({ success: false, message: 'Bu gönderiye zaten taşıyıcı atanmış' });
      }

      const listings = await getListingsCols();
      if (!listings.cols.shipmentIdCol || !listings.cols.nakliyeciIdCol) {
        return res.status(500).json({ success: false, message: 'Carrier market listings schema not compatible' });
      }

      const nowExpr = 'CURRENT_TIMESTAMP';
      const insertCols = [
        listings.qCol(listings.cols.shipmentIdCol),
        listings.qCol(listings.cols.nakliyeciIdCol),
      ];
      const insertVals = ['$1', '$2'];
      const params = [shipmentId, userId];

      if (listings.cols.minPriceCol && minPrice != null && Number.isFinite(minPrice)) {
        insertCols.push(listings.qCol(listings.cols.minPriceCol));
        params.push(minPrice);
        insertVals.push(`$${params.length}`);
      }
      if (listings.cols.statusCol) {
        insertCols.push(listings.qCol(listings.cols.statusCol));
        params.push('open');
        insertVals.push(`$${params.length}`);
      }
      if (listings.cols.updatedAtCol) insertCols.push(listings.qCol(listings.cols.updatedAtCol));
      if (listings.cols.createdAtCol) insertCols.push(listings.qCol(listings.cols.createdAtCol));
      if (listings.cols.updatedAtCol) insertVals.push(nowExpr);
      if (listings.cols.createdAtCol) insertVals.push(nowExpr);

      const conflictCols = `${listings.qCol(listings.cols.shipmentIdCol)}, ${listings.qCol(listings.cols.nakliyeciIdCol)}`;
      const setParts = [];
      if (listings.cols.minPriceCol && minPrice != null && Number.isFinite(minPrice)) {
        params.push(minPrice);
        setParts.push(`${listings.qCol(listings.cols.minPriceCol)} = $${params.length}`);
      }
      if (listings.cols.statusCol) {
        params.push('open');
        setParts.push(`${listings.qCol(listings.cols.statusCol)} = $${params.length}`);
      }
      if (listings.cols.updatedAtCol) setParts.push(`${listings.qCol(listings.cols.updatedAtCol)} = ${nowExpr}`);

      const returningCols = [
        `${listings.qCol(listings.cols.idCol || 'id')} as id`,
        `${listings.qCol(listings.cols.shipmentIdCol)} as "shipmentId"`,
      ];
      if (listings.cols.minPriceCol) returningCols.push(`${listings.qCol(listings.cols.minPriceCol)} as "minPrice"`);
      if (listings.cols.statusCol) returningCols.push(`${listings.qCol(listings.cols.statusCol)} as status`);
      if (listings.cols.createdAtCol) returningCols.push(`${listings.qCol(listings.cols.createdAtCol)} as "createdAt"`);

      const q = `INSERT INTO "${listings.schema}".carrier_market_listings (${insertCols.join(', ')})
                 VALUES (${insertVals.join(', ')})
                 ON CONFLICT (${conflictCols}) DO UPDATE SET ${setParts.length ? setParts.join(', ') : `${listings.qCol(listings.cols.updatedAtCol || 'updatedAt')} = ${nowExpr}`}
                 RETURNING ${returningCols.join(', ')}`;
      const ins = await pool.query(q, params);
      const listing = ins.rows && ins.rows[0] ? ins.rows[0] : null;

      try {
        if (createNotification) {
          await createNotification(
            userId,
            'listing_opened',
            'İlan Açıldı',
            `Gönderi #${shipmentId} için ilan açıldı.`,
            `/shipments/${shipmentId}`,
            'success',
            { shipmentId }
          );
        }
      } catch (_) {
        // ignore
      }

      return res.json({ success: true, data: { listing } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'İlan oluşturulamadı', error: error.message });
    }
  });

  // Get my listings (nakliyeci)
  router.get('/listings', authenticateToken, async (req, res) => {
    try {
      if (!ensurePool(res)) return;

      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

      const mine = String(req.query?.mine || '') === '1';
      const listings = await getListingsCols();
      if (!listings.cols.nakliyeciIdCol) {
        return res.status(500).json({ success: false, message: 'Carrier market listings schema not compatible' });
      }

      const where = [];
      const params = [];
      if (mine) {
        params.push(userId);
        where.push(`${listings.qCol(listings.cols.nakliyeciIdCol)} = $${params.length}`);
      }
      if (listings.cols.statusCol) {
        where.push(`${listings.qCol(listings.cols.statusCol)} IN ('open','closed')`);
      }

      const ship = await getShipmentsCols();

      const lIdExpr = `l.${listings.qCol(listings.cols.idCol || 'id')}`;
      const lShipmentExpr = `l.${listings.qCol(listings.cols.shipmentIdCol)}`;
      const sIdExpr = ship.cols.idCol ? `s.${ship.qCol(ship.cols.idCol)}` : 'NULL';
      const sTitleExpr = ship.cols.titleCol ? `s.${ship.qCol(ship.cols.titleCol)}` : 'NULL';
      const sPickupCityExpr = ship.cols.pickupCityCol ? `s.${ship.qCol(ship.cols.pickupCityCol)}` : 'NULL';
      const sDeliveryCityExpr = ship.cols.deliveryCityCol ? `s.${ship.qCol(ship.cols.deliveryCityCol)}` : 'NULL';
      const sPickupAddrExpr = ship.cols.pickupAddressCol ? `s.${ship.qCol(ship.cols.pickupAddressCol)}` : 'NULL';
      const sDeliveryAddrExpr = ship.cols.deliveryAddressCol ? `s.${ship.qCol(ship.cols.deliveryAddressCol)}` : 'NULL';

      const selectParts = [
        `${lIdExpr} as id`,
        `${lShipmentExpr} as "shipmentId"`,
      ];
      if (listings.cols.minPriceCol) selectParts.push(`l.${listings.qCol(listings.cols.minPriceCol)} as "minPrice"`);
      if (listings.cols.createdAtCol) selectParts.push(`l.${listings.qCol(listings.cols.createdAtCol)} as "createdAt"`);
      if (listings.cols.statusCol) selectParts.push(`l.${listings.qCol(listings.cols.statusCol)} as status`);

      selectParts.push(`COALESCE(${sTitleExpr}, ${sPickupCityExpr} || ' → ' || ${sDeliveryCityExpr}) as "shipmentTitle"`);
      selectParts.push(`COALESCE(${sPickupAddrExpr}, ${sPickupCityExpr}) as "pickupAddress"`);
      selectParts.push(`COALESCE(${sDeliveryAddrExpr}, ${sDeliveryCityExpr}) as "deliveryAddress"`);
      selectParts.push(`${sPickupCityExpr} as "pickupCity"`);
      selectParts.push(`${sDeliveryCityExpr} as "deliveryCity"`);

      const orderExpr = listings.cols.createdAtCol ? `l.${listings.qCol(listings.cols.createdAtCol)}` : lIdExpr;
      const q = `SELECT ${selectParts.join(', ')}
                 FROM "${listings.schema}".carrier_market_listings l
                 LEFT JOIN "${ship.schema}".shipments s ON ${lShipmentExpr} = ${sIdExpr}
                 ${where.length ? `WHERE ${where.map(w => `l.${w}`).join(' AND ')}` : ''}
                 ORDER BY ${orderExpr} DESC
                 LIMIT 200`;

      const rowsRes = await pool.query(q, params);
      return res.json({ success: true, data: { listings: rowsRes.rows || [] } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'İlanlar alınamadı', error: error.message });
    }
  });

  // Get available listings for drivers
  router.get('/available', authenticateToken, async (req, res) => {
    try {
      if (!ensurePool(res)) return;

      const listings = await getListingsCols();
      const ship = await getShipmentsCols();
      const users = await getUsersCols();

      const rawFromCity = req.query?.fromCity;
      const rawToCity = req.query?.toCity;
      const fromCity = typeof rawFromCity === 'string' ? rawFromCity.trim() : '';
      const toCity = typeof rawToCity === 'string' ? rawToCity.trim() : '';

      if (!listings.cols.shipmentIdCol) {
        return res.status(500).json({ success: false, message: 'Carrier market listings schema not compatible' });
      }

      const where = [];
      const params = [];
      if (listings.cols.statusCol) where.push(`l.${listings.qCol(listings.cols.statusCol)} = 'open'`);

      if (fromCity && ship.cols.pickupCityCol) {
        params.push(`%${fromCity}%`);
        where.push(`s.${ship.qCol(ship.cols.pickupCityCol)} ILIKE $${params.length}`);
      }
      if (toCity && ship.cols.deliveryCityCol) {
        params.push(`%${toCity}%`);
        where.push(`s.${ship.qCol(ship.cols.deliveryCityCol)} ILIKE $${params.length}`);
      }

      const shipIdExpr = `s.${ship.qCol(ship.cols.idCol)}`;
      const joinExpr = `l.${listings.qCol(listings.cols.shipmentIdCol)} = ${shipIdExpr}`;
      
      // Join users table to get owner (shipper) information
      const owner_idExpr = ship.cols.ownerCol ? `s.${ship.qCol(ship.cols.ownerCol)}` : null;
      const uIdExpr = `u.${users.qCol(users.cols.idCol)}`;
      const uFullNameExpr = users.cols.fullNameCol ? `u.${users.qCol(users.cols.fullNameCol)}` : 'NULL';
      const uCompanyNameExpr = users.cols.companyNameCol ? `u.${users.qCol(users.cols.companyNameCol)}` : 'NULL';
      const uEmailExpr = users.cols.emailCol ? `u.${users.qCol(users.cols.emailCol)}` : 'NULL';

      const listingSelect = [
        `l.${listings.qCol(listings.cols.idCol || 'id')} as id`,
        `l.${listings.qCol(listings.cols.shipmentIdCol)} as "shipmentId"`,
      ];
      if (listings.cols.minPriceCol) listingSelect.push(`l.${listings.qCol(listings.cols.minPriceCol)} as "minPrice"`);
      if (listings.cols.createdAtCol) listingSelect.push(`l.${listings.qCol(listings.cols.createdAtCol)} as "createdAt"`);
      if (listings.cols.statusCol) listingSelect.push(`l.${listings.qCol(listings.cols.statusCol)} as status`);

      // Add owner (shipper) information
      if (owner_idExpr && users.cols.fullNameCol) {
        listingSelect.push(`${uFullNameExpr} as "ownerName"`);
      }
      if (owner_idExpr && users.cols.companyNameCol) {
        listingSelect.push(`${uCompanyNameExpr} as "ownerCompany"`);
      }
      if (owner_idExpr && users.cols.emailCol) {
        listingSelect.push(`${uEmailExpr} as "ownerEmail"`);
      }

      const orderExpr = listings.cols.createdAtCol ? `l.${listings.qCol(listings.cols.createdAtCol)}` : `l.${listings.qCol(listings.cols.idCol || 'id')}`;

      const joinUsersClause = owner_idExpr ? `LEFT JOIN "${users.schema}".users u ON ${owner_idExpr} = ${uIdExpr}` : '';

      const q = `SELECT ${listingSelect.join(', ')}, row_to_json(s) as shipment
                 FROM "${listings.schema}".carrier_market_listings l
                 JOIN "${ship.schema}".shipments s ON ${joinExpr}
                 ${joinUsersClause}
                 ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                 ORDER BY ${orderExpr} DESC
                 LIMIT 200`;

      const rowsRes = await pool.query(q, params);
      return res.json({ success: true, data: rowsRes.rows || [] });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Açık ilanlar alınamadı', error: error.message });
    }
  });

  router.get('/bids', authenticateToken, async (req, res) => {
    try {
      if (!ensurePool(res)) return;

      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

      const mine = String(req.query?.mine || '') === '1';
      const listingId = req.query?.listingId != null ? Number(req.query.listingId) : null;

      const bids = await getBidsCols();
      const listings = await getListingsCols();
      const ship = await getShipmentsCols();
      const users = await getUsersCols();

      if (!bids.cols.listingIdCol || !bids.cols.carrierIdCol || !bids.cols.bidPriceCol) {
        return res.status(500).json({ success: false, message: 'Carrier market bids schema not compatible' });
      }
      if (!listings.cols.shipmentIdCol) {
        return res.status(500).json({ success: false, message: 'Carrier market listings schema not compatible' });
      }

      const where = [];
      const params = [];

      if (listingId) {
        params.push(listingId);
        where.push(`b.${bids.qCol(bids.cols.listingIdCol)} = $${params.length}`);
      }
      if (mine) {
        params.push(userId);
        where.push(`b.${bids.qCol(bids.cols.carrierIdCol)} = $${params.length}`);
      }

      const lIdExpr = `l.${listings.qCol(listings.cols.idCol || 'id')}`;
      const lShipmentExpr = listings.cols.shipmentIdCol ? `l.${listings.qCol(listings.cols.shipmentIdCol)}` : 'NULL';
      const sIdExpr = ship.cols.idCol ? `s.${ship.qCol(ship.cols.idCol)}` : 'NULL';
      const sTitleExpr = ship.cols.titleCol ? `s.${ship.qCol(ship.cols.titleCol)}` : 'NULL';
      const sPickupAddrExpr = ship.cols.pickupAddressCol ? `s.${ship.qCol(ship.cols.pickupAddressCol)}` : 'NULL';
      const sDeliveryAddrExpr = ship.cols.deliveryAddressCol ? `s.${ship.qCol(ship.cols.deliveryAddressCol)}` : 'NULL';
      const sPickupCityExpr = ship.cols.pickupCityCol ? `s.${ship.qCol(ship.cols.pickupCityCol)}` : 'NULL';
      const sDeliveryCityExpr = ship.cols.deliveryCityCol ? `s.${ship.qCol(ship.cols.deliveryCityCol)}` : 'NULL';
      const sWeightExpr = ship.cols.weightCol ? `s.${ship.qCol(ship.cols.weightCol)}` : 'NULL';
      const sVolumeExpr = ship.cols.volumeCol ? `s.${ship.qCol(ship.cols.volumeCol)}` : 'NULL';

      const uIdExpr = `u.${users.qCol(users.cols.idCol)}`;
      const uFullNameExpr = users.cols.fullNameCol ? `u.${users.qCol(users.cols.fullNameCol)}` : 'NULL';
      const uPhoneExpr = users.cols.phoneCol ? `u.${users.qCol(users.cols.phoneCol)}` : 'NULL';

      const q = `SELECT b.${bids.qCol(bids.cols.idCol || 'id')} as id,
                        b.${bids.qCol(bids.cols.listingIdCol)} as "listingId",
                        b.${bids.qCol(bids.cols.carrierIdCol)} as "carrierId",
                        ${lShipmentExpr} as "shipmentId",
                        COALESCE(${sTitleExpr}, ${sPickupCityExpr} || ' → ' || ${sDeliveryCityExpr}) as "shipmentTitle",
                        COALESCE(${sPickupAddrExpr}, ${sPickupCityExpr}) as "pickupAddress",
                        COALESCE(${sDeliveryAddrExpr}, ${sDeliveryCityExpr}) as "deliveryAddress",
                        ${sWeightExpr} as weight,
                        ${sVolumeExpr} as volume,
                        b.${bids.qCol(bids.cols.bidPriceCol)} as "bidPrice",
                        ${bids.cols.etaHoursCol ? `b.${bids.qCol(bids.cols.etaHoursCol)} as "etaHours",` : 'NULL as "etaHours",'}
                        b.${bids.qCol(bids.cols.statusCol || 'status')} as status,
                        b.${bids.qCol(bids.cols.createdAtCol || bids.cols.idCol || 'id')} as "createdAt",
                        ${uFullNameExpr} as "carrierName",
                        ${uPhoneExpr} as "carrierPhone"
                 FROM "${bids.schema}".carrier_market_bids b
                 LEFT JOIN "${users.schema}".users u ON b.${bids.qCol(bids.cols.carrierIdCol)} = ${uIdExpr}
                 LEFT JOIN "${listings.schema}".carrier_market_listings l ON b.${bids.qCol(bids.cols.listingIdCol)} = ${lIdExpr}
                 LEFT JOIN "${ship.schema}".shipments s ON ${lShipmentExpr} = ${sIdExpr}
                 ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                 ORDER BY b.${bids.qCol(bids.cols.createdAtCol || bids.cols.idCol || 'id')} DESC
                 LIMIT 500`;

      const rowsRes = await pool.query(q, params);
      const out = rowsRes.rows || [];
      return res.json({ success: true, data: { bids: out } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Teklifler alınamadı', error: error.message });
    }
  });

  router.post('/bids', authenticateToken, async (req, res) => {
    try {
      if (!ensurePool(res)) return;

      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

      const listingId = Number(req.body?.listingId);
      const bidPrice = Number(req.body?.bidPrice);
      const etaHours = req.body?.etaHours != null ? Number(req.body.etaHours) : null;
      if (!listingId || !Number.isFinite(bidPrice)) {
        return res.status(400).json({ success: false, message: 'listingId ve bidPrice gerekli' });
      }

      const bids = await getBidsCols();
      const listings = await getListingsCols();
      const listIdExpr = `l.${listings.qCol(listings.cols.idCol || 'id')}`;
      const listStatusExpr = listings.cols.statusCol ? `l.${listings.qCol(listings.cols.statusCol)}` : null;

      const listRes = await pool.query(
        `SELECT ${listIdExpr} as id${listStatusExpr ? `, ${listStatusExpr} as status` : ''}${listings.cols.minPriceCol ? `, ${listings.qCol(listings.cols.minPriceCol)} as min_price` : ''} FROM "${listings.schema}".carrier_market_listings l WHERE ${listIdExpr} = $1`,
        [listingId]
      );
      const listing = listRes.rows && listRes.rows[0] ? listRes.rows[0] : null;
      if (!listing) return res.status(404).json({ success: false, message: 'İlan bulunamadı' });
      if (listing.status && String(listing.status) !== 'open') {
        return res.status(409).json({ success: false, message: 'İlan kapalı' });
      }
      
      // Validate bid against listing budget
      if (listing.min_price != null && bidPrice > listing.min_price) {
        return res.status(400).json({ success: false, message: `Teklif taşıyıcı bütçesini (tavan) aşıyor: ${listing.min_price} TL` });
      }

      const nowExpr = 'CURRENT_TIMESTAMP';
      const insertCols = [bids.qCol(bids.cols.listingIdCol), bids.qCol(bids.cols.carrierIdCol), bids.qCol(bids.cols.bidPriceCol)];
      const insertVals = ['$1', '$2', '$3'];
      const params = [listingId, userId, bidPrice];
      if (bids.cols.etaHoursCol && etaHours != null && Number.isFinite(etaHours)) {
        insertCols.push(bids.qCol(bids.cols.etaHoursCol));
        params.push(etaHours);
        insertVals.push(`$${params.length}`);
      }
      if (bids.cols.statusCol) {
        insertCols.push(bids.qCol(bids.cols.statusCol));
        params.push('pending');
        insertVals.push(`$${params.length}`);
      }
      if (bids.cols.createdAtCol) insertCols.push(bids.qCol(bids.cols.createdAtCol));
      if (bids.cols.updatedAtCol) insertCols.push(bids.qCol(bids.cols.updatedAtCol));
      if (bids.cols.createdAtCol) insertVals.push(nowExpr);
      if (bids.cols.updatedAtCol) insertVals.push(nowExpr);

      const conflictCols = `${bids.qCol(bids.cols.listingIdCol)}, ${bids.qCol(bids.cols.carrierIdCol)}`;
      const setParts = [`${bids.qCol(bids.cols.bidPriceCol)} = EXCLUDED.${bids.qCol(bids.cols.bidPriceCol)}`];
      if (bids.cols.etaHoursCol) setParts.push(`${bids.qCol(bids.cols.etaHoursCol)} = EXCLUDED.${bids.qCol(bids.cols.etaHoursCol)}`);
      if (bids.cols.updatedAtCol) setParts.push(`${bids.qCol(bids.cols.updatedAtCol)} = ${nowExpr}`);

      const returningCols = [
        `${bids.qCol(bids.cols.idCol || 'id')} as id`,
        `${bids.qCol(bids.cols.listingIdCol)} as "listingId"`,
        `${bids.qCol(bids.cols.bidPriceCol)} as "bidPrice"`,
      ];
      if (bids.cols.etaHoursCol) returningCols.push(`${bids.qCol(bids.cols.etaHoursCol)} as "etaHours"`);
      if (bids.cols.statusCol) returningCols.push(`${bids.qCol(bids.cols.statusCol)} as status`);
      if (bids.cols.createdAtCol) returningCols.push(`${bids.qCol(bids.cols.createdAtCol)} as "createdAt"`);

      const q = `INSERT INTO "${bids.schema}".carrier_market_bids (${insertCols.join(', ')})
                 VALUES (${insertVals.join(', ')})
                 ON CONFLICT (${conflictCols}) DO UPDATE SET ${setParts.join(', ')}
                 RETURNING ${returningCols.join(', ')}`;
      const ins = await pool.query(q, params);
      const bid = ins.rows && ins.rows[0] ? ins.rows[0] : null;
      return res.json({ success: true, data: { bid } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Teklif verilemedi', error: error.message });
    }
  });

  router.post('/bids/:id/accept', authenticateToken, async (req, res) => {
    try {
      if (!ensurePool(res)) return;

      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
      if (role && role !== 'nakliyeci') return res.status(403).json({ success: false, message: 'Forbidden' });

      const bidId = Number(req.params.id);
      if (!bidId) return res.status(400).json({ success: false, message: 'Invalid bid id' });

      const bids = await getBidsCols();
      const listings = await getListingsCols();
      const ship = await getShipmentsCols();

      const bidRes = await pool.query(
        `SELECT b.${bids.qCol(bids.cols.idCol || 'id')} as id,
                b.${bids.qCol(bids.cols.listingIdCol)} as listing_id,
                b.${bids.qCol(bids.cols.carrierIdCol)} as carrier_id,
                b.${bids.qCol(bids.cols.bidPriceCol)} as bid_price
         FROM "${bids.schema}".carrier_market_bids b
         WHERE b.${bids.qCol(bids.cols.idCol || 'id')} = $1`,
        [bidId]
      );
      const bidRow = bidRes.rows && bidRes.rows[0] ? bidRes.rows[0] : null;
      if (!bidRow) return res.status(404).json({ success: false, message: 'Teklif bulunamadı' });

      const listRes = await pool.query(
        `SELECT l.${listings.qCol(listings.cols.idCol || 'id')} as id,
                l.${listings.qCol(listings.cols.shipmentIdCol)} as shipment_id,
                l.${listings.qCol(listings.cols.nakliyeciIdCol)} as nakliyeci_id
         FROM "${listings.schema}".carrier_market_listings l
         WHERE l.${listings.qCol(listings.cols.idCol || 'id')} = $1`,
        [bidRow.listing_id]
      );
      const listing = listRes.rows && listRes.rows[0] ? listRes.rows[0] : null;
      if (!listing) return res.status(404).json({ success: false, message: 'İlan bulunamadı' });
      if (String(listing.nakliyeci_id) !== String(userId)) {
        return res.status(403).json({ success: false, message: 'Bu ilan için işlem yapamazsınız' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        try {
          // Accept this bid
          if (bids.cols.statusCol) {
            await client.query(
              `UPDATE "${bids.schema}".carrier_market_bids SET ${bids.qCol(bids.cols.statusCol)} = 'accepted'${bids.cols.updatedAtCol ? `, ${bids.qCol(bids.cols.updatedAtCol)} = CURRENT_TIMESTAMP` : ''}
               WHERE ${bids.qCol(bids.cols.idCol || 'id')} = $1`,
              [bidId]
            );
            // Reject others
            await client.query(
              `UPDATE "${bids.schema}".carrier_market_bids SET ${bids.qCol(bids.cols.statusCol)} = 'rejected'${bids.cols.updatedAtCol ? `, ${bids.qCol(bids.cols.updatedAtCol)} = CURRENT_TIMESTAMP` : ''}
               WHERE ${bids.qCol(bids.cols.listingIdCol)} = $1 AND ${bids.qCol(bids.cols.idCol || 'id')} <> $2`,
              [bidRow.listing_id, bidId]
            );
          }

          // Close listing
          if (listings.cols.statusCol) {
            await client.query(
              `UPDATE "${listings.schema}".carrier_market_listings SET ${listings.qCol(listings.cols.statusCol)} = 'closed'${listings.cols.updatedAtCol ? `, ${listings.qCol(listings.cols.updatedAtCol)} = CURRENT_TIMESTAMP` : ''}
               WHERE ${listings.qCol(listings.cols.idCol || 'id')} = $1`,
              [bidRow.listing_id]
            );
          }

          // Assign driver on shipment and update status
          // IMPORTANT: In PostgreSQL, a failed statement inside a transaction marks the transaction as aborted.
          // We use SAVEPOINT to safely try multiple candidate statuses when a CHECK constraint exists.
          const shipIdExpr = ship.qCol(ship.cols.idCol);

          // Preserve original shipment.price (customer price). Store carrier payout in shipments.metadata.
          // Merge with existing metadata to avoid overwriting other fields.
          let mergedMetadata = null;
          if (ship.cols.metadataCol) {
            const metaRes = await client.query(
              `SELECT ${ship.qCol(ship.cols.metadataCol)} as metadata FROM "${ship.schema}".shipments WHERE ${shipIdExpr} = $1`,
              [listing.shipment_id]
            );
            let currentMeta = metaRes.rows && metaRes.rows[0] ? metaRes.rows[0].metadata : null;
            if (typeof currentMeta === 'string') {
              try {
                currentMeta = JSON.parse(currentMeta);
              } catch (_) {
                currentMeta = null;
              }
            }
            if (!currentMeta || typeof currentMeta !== 'object') currentMeta = {};
            mergedMetadata = { ...currentMeta, carrierPayout: bidRow.bid_price };
          }

          const buildUpdate = (statusValueOrNull) => {
            const parts = [];
            const params = [];

            if (ship.cols.statusCol && statusValueOrNull != null) {
              params.push(statusValueOrNull);
              parts.push(`${ship.qCol(ship.cols.statusCol)} = $${params.length}`);
            }
            if (ship.cols.driverCol) {
              params.push(bidRow.carrier_id);
              parts.push(`${ship.qCol(ship.cols.driverCol)} = $${params.length}`);
            }
            // Preserve original shipment.price; store carrier payout in metadata (merged).
            if (ship.cols.metadataCol && mergedMetadata) {
              params.push(JSON.stringify(mergedMetadata));
              parts.push(`${ship.qCol(ship.cols.metadataCol)} = $${params.length}`);
            }
            if (ship.cols.updatedAtCol) {
              parts.push(`${ship.qCol(ship.cols.updatedAtCol)} = CURRENT_TIMESTAMP`);
            }

            params.push(listing.shipment_id);
            const sql = `UPDATE "${ship.schema}".shipments SET ${parts.join(', ')} WHERE ${shipIdExpr} = $${params.length}`;
            return { sql, params };
          };

          if (ship.cols.statusCol) {
            const candidates = ['assigned', 'in_progress', 'offer_accepted', 'accepted', 'in_transit', 'waiting_for_offers'];
            let updated = false;
            for (const c of candidates) {
              await client.query('SAVEPOINT shipment_status_try');
              try {
                const { sql, params } = buildUpdate(c);
                await client.query(sql, params);
                await client.query('RELEASE SAVEPOINT shipment_status_try');
                updated = true;
                break;
              } catch (e) {
                await client.query('ROLLBACK TO SAVEPOINT shipment_status_try');
                await client.query('RELEASE SAVEPOINT shipment_status_try');
                // 23514 = check_violation
                if (!(e && e.code === '23514')) {
                  throw e;
                }
              }
            }

            if (!updated) {
              const { sql, params } = buildUpdate(null);
              await client.query(sql, params);
            }
          } else {
            const { sql, params } = buildUpdate(null);
            await client.query(sql, params);
          }

          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        }
      } finally {
        client.release();
      }

      try {
        if (createNotification) {
          await createNotification(
            bidRow.carrier_id,
            'bid_accepted',
            'Teklif Kabul Edildi',
            `İlan teklifiniz kabul edildi. İş No: #${listing.shipment_id}`,
            `/tasiyici/active-shipments`,
            'success',
            { shipmentId: listing.shipment_id, listingId: bidRow.listing_id, bidId }
          );
        }
      } catch (_) {
        // ignore
      }

      return res.json({ success: true, message: 'Teklif kabul edildi! İş taşıyıcıya atandı.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Kabul edilemedi', error: error.message });
    }
  });

  router.post('/bids/:id/reject', authenticateToken, async (req, res) => {
    try {
      if (!ensurePool(res)) return;

      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
      if (role && role !== 'nakliyeci') return res.status(403).json({ success: false, message: 'Forbidden' });

      const bidId = Number(req.params.id);
      if (!bidId) return res.status(400).json({ success: false, message: 'Invalid bid id' });

      const bids = await getBidsCols();
      const listings = await getListingsCols();

      if (!bids.cols.listingIdCol || !listings.cols.nakliyeciIdCol) {
        return res.status(500).json({ success: false, message: 'Schema not compatible' });
      }

      const bidRes = await pool.query(
        `SELECT b.${bids.qCol(bids.cols.idCol || 'id')} as id,
                b.${bids.qCol(bids.cols.listingIdCol)} as listing_id
         FROM "${bids.schema}".carrier_market_bids b
         WHERE b.${bids.qCol(bids.cols.idCol || 'id')} = $1`,
        [bidId]
      );
      const bidRow = bidRes.rows && bidRes.rows[0] ? bidRes.rows[0] : null;
      if (!bidRow) return res.status(404).json({ success: false, message: 'Teklif bulunamadı' });

      const listRes = await pool.query(
        `SELECT l.${listings.qCol(listings.cols.idCol || 'id')} as id,
                l.${listings.qCol(listings.cols.nakliyeciIdCol)} as nakliyeci_id
         FROM "${listings.schema}".carrier_market_listings l
         WHERE l.${listings.qCol(listings.cols.idCol || 'id')} = $1`,
        [bidRow.listing_id]
      );
      const listing = listRes.rows && listRes.rows[0] ? listRes.rows[0] : null;
      if (!listing) return res.status(404).json({ success: false, message: 'İlan bulunamadı' });
      if (String(listing.nakliyeci_id) !== String(userId)) {
        return res.status(403).json({ success: false, message: 'Bu ilan için işlem yapamazsınız' });
      }

      if (!bids.cols.statusCol) {
        return res.status(500).json({ success: false, message: 'Bids schema not compatible' });
      }

      const setParts = [`${bids.qCol(bids.cols.statusCol)} = 'rejected'`];
      if (bids.cols.updatedAtCol) {
        setParts.push(`${bids.qCol(bids.cols.updatedAtCol)} = CURRENT_TIMESTAMP`);
      }

      await pool.query(
        `UPDATE "${bids.schema}".carrier_market_bids
         SET ${setParts.join(', ')}
         WHERE ${bids.qCol(bids.cols.idCol || 'id')} = $1`,
        [bidId]
      );

      // Notify carrier that their bid was rejected (best-effort)
      try {
        if (createNotification && bidRow.carrier_id) {
          await createNotification(
            bidRow.carrier_id,
            'bid_rejected',
            'Teklifiniz Reddedildi',
            `İlan teklifiniz reddedildi. İş No: #${listing.shipment_id}`,
            `/tasiyici/active-shipments`,
            'normal',
            { shipmentId: listing.shipment_id, listingId: bidRow.listing_id, bidId }
          );
        }
      } catch (_) {
        // ignore
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Teklif reddedilemedi', error: error.message });
    }
  });

  return router;
}

module.exports = createCarrierMarketRoutes;
