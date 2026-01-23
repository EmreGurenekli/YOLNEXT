/**
 * PostgreSQL Helper Functions
 * Tüm database işlemleri için helper fonksiyonlar
 */

import { query, getClient } from './postgres-connection.js';

// ========================================
// USER HELPERS
// ========================================

export const getUserByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email]
  );
  return result.rows[0] || null;
};

export const getUserById = async (id) => {
  const result = await query(
    'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return result.rows[0] || null;
};

export const createUser = async (userData) => {
  const result = await query(`
    INSERT INTO users (
      email, password_hash, first_name, last_name, phone, user_type,
      company_name, address, city, district, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    userData.email,
    userData.password_hash,
    userData.first_name,
    userData.last_name,
    userData.phone || null,
    userData.user_type,
    userData.company_name || null,
    userData.address || null,
    userData.city || null,
    userData.district || null,
    new Date().toISOString(),
    new Date().toISOString()
  ]);
  return result.rows[0];
};

// ========================================
// SHIPMENT HELPERS
// ========================================

export const getShipmentsByUserId = async (userId, filters = {}) => {
  // Support both string and integer userId
  // Use 'user_id' column (not 'userid') based on database schema
  let sql = 'SELECT * FROM shipments WHERE "user_id"::text = $1::text';
  const params = [userId.toString()];
  let paramIndex = 2;
  
  if (filters.status && filters.status !== 'all') {
    sql += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }
  
  if (filters.search) {
    sql += ` AND (
      title ILIKE $${paramIndex} OR 
      description ILIKE $${paramIndex} OR 
      "pickup_address" ILIKE $${paramIndex} OR 
      "delivery_address" ILIKE $${paramIndex}
    )`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }
  
  sql += ' ORDER BY "created_at" DESC';
  
  const result = await query(sql, params);
  return result.rows;
};

export const getShipmentById = async (id) => {
  const result = await query(
    'SELECT * FROM shipments WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const createShipment = async (shipmentData) => {
  console.log('📦 POST /api/shipments - Request received');
  // Use snake_case column names matching real_schema.sql
  // Ensure NOT NULL fields have valid values
  const pickupAddress = shipmentData.pickupAddress || shipmentData.pickupCity || 'Adres belirtilmemiş';
  const deliveryAddress = shipmentData.deliveryAddress || shipmentData.deliveryCity || 'Adres belirtilmemiş';
  const pickupCity = shipmentData.pickupCity || '';
  const pickupDistrict = shipmentData.pickupDistrict || 'Bilinmiyor';
  const deliveryCity = shipmentData.deliveryCity || '';
  const deliveryDistrict = shipmentData.deliveryDistrict || 'Bilinmiyor';
  
  // Map frontend status to database status
  // Frontend: 'open', 'pending' -> Database: 'active'
  // Frontend: 'in_transit' -> Database: 'in_progress'
  // Frontend: 'delivered' -> Database: 'completed'
  let dbStatus = 'active';
  if (shipmentData.status === 'open' || shipmentData.status === 'pending') {
    dbStatus = 'active';
  } else if (shipmentData.status === 'in_transit') {
    dbStatus = 'in_progress';
  } else if (shipmentData.status === 'delivered') {
    dbStatus = 'completed';
  } else if (shipmentData.status) {
    dbStatus = shipmentData.status;
  }
  
  // Build insert parameters
  const insertParams = [
    shipmentData.userId,
    shipmentData.title || 'Gönderi',
    shipmentData.description || shipmentData.productDescription || null,
    shipmentData.category || shipmentData.mainCategory || 'other',
    shipmentData.subcategory || null,
    pickupAddress,
    pickupCity,
    pickupDistrict,
    deliveryAddress,
    deliveryCity,
    deliveryDistrict,
    shipmentData.pickupDate || new Date().toISOString().split('T')[0],
    shipmentData.deliveryDate || new Date().toISOString().split('T')[0],
    shipmentData.weightKg || shipmentData.weight || null,
    shipmentData.volumeM3 || shipmentData.volume || null,
    shipmentData.budgetMin || null,
    shipmentData.budgetMax || shipmentData.price || null,
    'TRY',
    dbStatus,
    shipmentData.specialRequirements || null,
    new Date().toISOString(),
    new Date().toISOString()
  ];
  
  // Build column list - Use '"user_id"' (snake_case with quotes) to match database schema
  // Schema uses '"user_id"' not 'userid'
  const columnList = '"user_id", title, description, category, subcategory, "pickup_address", "pickup_city", "pickup_district", "delivery_address", "delivery_city", "delivery_district", "pickup_date", "delivery_date", weight_kg, volume_m3, budget_min, budget_max, currency, status, "special_requirements", "created_at", "updated_at"';
  
  // Verify columnList starts with '"user_id"'
  if (!columnList.startsWith('"user_id"')) {
    throw new Error('CRITICAL: columnList must start with "\"user_id\""');
  }
  
  // Verify first column in split array is '"user_id"'
  const columnsArray = columnList.split(', ');
  if (columnsArray[0] !== '"user_id"') {
    console.error('❌ CRITICAL ERROR: First column is not "\"user_id\""!', columnsArray[0]);
    throw new Error(`CRITICAL: First column must be "\"user_id\"", but got "${columnsArray[0]}"`);
  }
  
  console.log('📦 Executing INSERT query:', {
    paramCount: insertParams.length,
    columnCount: columnsArray.length,
    columns: columnsArray, // Show ALL columns to verify user_id is used
    firstColumn: columnsArray[0], // MUST be '"user_id"'
    firstParams: insertParams.slice(0, 5),
    userId: shipmentData.userId,
    columnListStartsWith: columnsArray[0] // Must be '"user_id"'
  });
  
  const result = await query(`
    INSERT INTO shipments (
      ${columnList}
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *
  `, insertParams);
  return result.rows[0];
};

export const updateShipment = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${dbKey} = $${paramIndex}`);
      values.push(updates[key]);
      paramIndex++;
    }
  });
  
  if (fields.length === 0) {
    return null;
  }
  
  fields.push(`updated_at = $${paramIndex}`);
  values.push(new Date().toISOString());
  values.push(id);
  
  const result = await query(
    `UPDATE shipments SET ${fields.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

// ========================================
// OFFER HELPERS
// ========================================

export const getOffersByShipmentUserId = async (shipmentUserId) => {
  const result = await query(
    'SELECT * FROM offers WHERE shipment_user_id = $1 ORDER BY created_at DESC',
    [shipmentUserId]
  );
  return result.rows;
};

export const getOffersByCarrierId = async (carrierId) => {
  // Support both string and integer carrierId
  const result = await query(
    'SELECT * FROM offers WHERE carrier_id::text = $1::text ORDER BY created_at DESC',
    [carrierId.toString()]
  );
  return result.rows;
};

export const createOffer = async (offerData) => {
  const result = await query(`
    INSERT INTO offers (
      shipment_id, shipment_user_id, carrier_id, price, message, status, estimated_delivery_date, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    offerData.shipmentId,
    offerData.shipmentUserId,
    offerData.carrierId,
    offerData.price,
    offerData.message || null,
    offerData.status || 'pending',
    offerData.estimatedDeliveryDate || null,
    new Date().toISOString(),
    new Date().toISOString()
  ]);
  return result.rows[0];
};

export const updateOffer = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${dbKey} = $${paramIndex}`);
      values.push(updates[key]);
      paramIndex++;
    }
  });
  
  if (fields.length === 0) {
    return null;
  }
  
  fields.push(`updated_at = $${paramIndex}`);
  values.push(new Date().toISOString());
  values.push(id);
  
  const result = await query(
    `UPDATE offers SET ${fields.join(', ')} WHERE id = $${paramIndex + 1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

// ========================================
// MESSAGE HELPERS
// ========================================

export const getConversation = async (userId, otherUserId) => {
  const result = await query(
    `SELECT * FROM conversations
     WHERE (participant1_id = $1 AND participant2_id = $2) OR (participant1_id = $2 AND participant2_id = $1)`,
    [userId, otherUserId]
  );
  return result.rows[0];
};

export const createConversation = async (participant1Id, participant2Id) => {
  const result = await query(`
    INSERT INTO conversations (participant1_id, participant2_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [
    participant1Id,
    participant2Id,
    new Date().toISOString(),
    new Date().toISOString()
  ]);
  return result.rows[0];
};

export const getMessagesByConversationId = async (conversationId) => {
  const result = await query(
    'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  );
  return result.rows;
};

export const createMessage = async (conversationId, senderId, content, shipmentId = null) => {
  const result = await query(`
    INSERT INTO messages (conversation_id, sender_id, content, shipment_id, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    conversationId,
    senderId,
    content,
    shipmentId,
    new Date().toISOString()
  ]);
  return result.rows[0];
};

// ========================================
// DRIVER HELPERS
// ========================================

export const linkDriverToNakliyeci = async (nakliyeciId, driverId) => {
  try {
    // Check if relationship already exists
    const existing = await query(
      'SELECT * FROM driver_nakliyeci_links WHERE nakliyeci_id = $1 AND driver_id = $2',
      [nakliyeciId, driverId]
    );
    
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }
    
    // Create new relationship
    const result = await query(`
      INSERT INTO driver_nakliyeci_links (nakliyeci_id, driver_id, created_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [
      nakliyeciId,
      driverId,
      new Date().toISOString()
    ]);
    return result.rows[0];
  } catch (err) {
    // Table might not exist, return null to fallback to JSON store
    console.log(`ℹ️ [INFO] PostgreSQL driver link skipped: ${err.message}`);
    return null;
  }
};

export const getDriversByNakliyeciId = async (nakliyeciId) => {
  try {
    const result = await query(
      `SELECT u.* FROM users u
       INNER JOIN driver_nakliyeci_links dnl ON u.id = dnl.driver_id
       WHERE dnl.nakliyeci_id = $1 AND u.deleted_at IS NULL`,
      [nakliyeciId]
    );
    return result.rows;
  } catch (err) {
    console.log(`ℹ️ [INFO] PostgreSQL getDriversByNakliyeciId skipped: ${err.message}`);
    return [];
  }
};

// ========================================
// FORMATTING HELPERS
// ========================================

export const formatShipmentFromDb = (dbShipment) => {
  if (!dbShipment) return null;
  // Database uses snake_case column names (real_schema.sql)
  // Convert to camelCase format expected by frontend
  // Support both snake_case and legacy lowercase/camelCase for backward compatibility
  const formatted = {
    id: dbShipment.id?.toString() || '',
    userId: (dbShipment.user_id || dbShipment.userid)?.toString() || '',
    title: dbShipment.title || '',
    description: dbShipment.description || '',
    category: dbShipment.category || 'other',
    subcategory: dbShipment.subcategory || null,
    // Address fields - prioritize snake_case, fallback to legacy formats
    pickupAddress: dbShipment.pickup_address || dbShipment.pickupaddress || dbShipment.pickup_city || dbShipment.pickupcity || '',
    pickupCity: dbShipment.pickup_city || dbShipment.pickupcity || '',
    pickupDistrict: dbShipment.pickup_district || dbShipment.pickupdistrict || '',
    pickupPostalCode: dbShipment.pickup_postal_code || dbShipment.pickuppostalcode || null,
    deliveryAddress: dbShipment.delivery_address || dbShipment.deliveryaddress || dbShipment.delivery_city || dbShipment.deliverycity || '',
    deliveryCity: dbShipment.delivery_city || dbShipment.deliverycity || '',
    deliveryDistrict: dbShipment.delivery_district || dbShipment.deliverydistrict || '',
    deliveryPostalCode: dbShipment.delivery_postal_code || dbShipment.deliverypostalcode || null,
    pickupDate: dbShipment.pickup_date || dbShipment.pickupdate || '',
    deliveryDate: dbShipment.delivery_date || dbShipment.deliverydate || '',
    // Map PostgreSQL status values to frontend expected values
    // PostgreSQL: 'active', 'in_progress', 'completed', 'cancelled', 'draft'
    // Frontend: 'open', 'pending', 'in_transit', 'delivered', 'cancelled'
    status: (() => {
      const pgStatus = dbShipment.status || 'active';
      if (pgStatus === 'active' || pgStatus === 'draft') return 'open';
      if (pgStatus === 'in_progress') return 'in_transit';
      if (pgStatus === 'completed') return 'delivered';
      return pgStatus; // 'cancelled' or other values pass through
    })(),
    price: dbShipment.budget_max || dbShipment.budget_min || dbShipment.price || 0,
    budgetMin: dbShipment.budget_min || null,
    budgetMax: dbShipment.budget_max || null,
    weight: dbShipment.weight_kg || dbShipment.weight || 0,
    volume: dbShipment.volume_m3 || dbShipment.volume || 0,
    createdAt: dbShipment.created_at || dbShipment.createdat || new Date().toISOString(),
    updatedAt: dbShipment.updated_at || dbShipment.updatedat || new Date().toISOString(),
    // Include other useful fields
    specialRequirements: dbShipment.special_requirements || dbShipment.specialrequirements || null,
    trackingNumber: dbShipment.tracking_number || dbShipment.trackingnumber || null,
    // Additional fields for compatibility
    from: dbShipment.pickup_address || dbShipment.pickupaddress || dbShipment.pickup_city || dbShipment.pickupcity || '',
    to: dbShipment.delivery_address || dbShipment.deliveryaddress || dbShipment.delivery_city || dbShipment.deliverycity || '',
    // Carrier information
    carrierId: dbShipment.carrier_id || dbShipment.nakliyeci_id || null,
    carrierName: dbShipment.carrier_name || null,
  };
  return formatted;
};
