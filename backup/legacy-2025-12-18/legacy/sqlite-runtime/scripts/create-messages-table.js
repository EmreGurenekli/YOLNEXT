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

  // Create messages table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      shipment_id TEXT,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users (id),
      FOREIGN KEY (receiver_id) REFERENCES users (id),
      FOREIGN KEY (shipment_id) REFERENCES shipments (id)
    )
  `;

  db.run(createTableSQL, err => {
    if (err) {
      console.error('Error creating messages table:', err);
    } else {
      console.log('Messages table created successfully');
    }

    // Create indexes for better performance
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_shipment_id ON messages(shipment_id);
    `;

    db.exec(createIndexesSQL, err => {
      if (err) {
        console.error('Error creating indexes:', err);
      } else {
        console.log('Indexes created successfully');
      }

      db.close();
    });
  });
});
