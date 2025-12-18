const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'yolnext.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }

  console.log('Connected to database');

  // Create a test shipment
  const shipmentId = 'test-shipment-1';
  const createShipmentSql = `
    INSERT OR IGNORE INTO shipments (
      id, user_id, title, description, category, 
      weight, pickup_address, pickup_city, delivery_address, delivery_city,
      pickup_date, delivery_date, price, status, tracking_number,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const shipmentParams = [
    shipmentId,
    '1', // user_id
    'Test Shipment',
    'Test shipment description',
    'general',
    100.5,
    'Test Pickup Address',
    'Istanbul',
    'Test Delivery Address',
    'Ankara',
    '2024-01-15',
    '2024-01-16',
    500.0,
    'accepted',
    'TEST123456',
    new Date().toISOString(),
    new Date().toISOString()
  ];

  db.run(createShipmentSql, shipmentParams, function(err) {
    if (err) {
      console.error('Error creating shipment:', err);
    } else {
      console.log('Shipment created with ID:', shipmentId);
      
      // Create a test offer for this shipment
      const offerId = 'test-offer-1';
      const createOfferSql = `
        INSERT OR IGNORE INTO offers (
          id, shipment_id, nakliyeci_id, price, message, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      const offerParams = [
        offerId,
        shipmentId,
        '1', // nakliyeci_id (same as user_id for demo)
        450.0,
        'Test offer message',
        'accepted',
        new Date().toISOString(),
        new Date().toISOString()
      ];

      db.run(createOfferSql, offerParams, function(err) {
        if (err) {
          console.error('Error creating offer:', err);
        } else {
          console.log('Offer created with ID:', offerId);
        }
        
        db.close();
      });
    }
  });
});