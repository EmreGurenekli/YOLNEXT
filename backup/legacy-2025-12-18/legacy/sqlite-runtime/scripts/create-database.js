const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database dosya yolu
const dbPath = path.join(__dirname, '..', 'database.sqlite');

console.log('🗄️ SQLite Database oluşturuluyor...');

// Database dosyasını oluştur
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database oluşturma hatası:', err.message);
    process.exit(1);
  }
  console.log('✅ Database bağlantısı başarılı');
});

// Users tablosu
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    userType TEXT NOT NULL CHECK(userType IN ('individual', 'corporate')),
    phone TEXT,
    companyName TEXT,
    taxNumber TEXT,
    isVerified BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Shipments tablosu
  db.run(`CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    pickupAddress TEXT NOT NULL,
    deliveryAddress TEXT NOT NULL,
    pickupDate DATETIME NOT NULL,
    deliveryDate DATETIME,
    weight REAL,
    dimensions TEXT,
    specialRequirements TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'delivered', 'cancelled')),
    price REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);

  // Offers tablosu
  db.run(`CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipmentId INTEGER NOT NULL,
    carrierId INTEGER NOT NULL,
    price REAL NOT NULL,
    message TEXT,
    estimatedDelivery DATETIME,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipmentId) REFERENCES shipments (id),
    FOREIGN KEY (carrierId) REFERENCES users (id)
  )`);

  // Messages tablosu
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId INTEGER NOT NULL,
    recipientId INTEGER NOT NULL,
    shipmentId INTEGER,
    message TEXT NOT NULL,
    readStatus BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES users (id),
    FOREIGN KEY (recipientId) REFERENCES users (id),
    FOREIGN KEY (shipmentId) REFERENCES shipments (id)
  )`);

  // Demo kullanıcıları ekle
  const demoUsers = [
    {
      firstName: 'Demo',
      lastName: 'Kullanıcı',
      email: 'demo@yolnext.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      userType: 'individual',
      phone: '+90 555 123 4567',
      isVerified: 1
    },
    {
      firstName: 'Demo',
      lastName: 'Nakliyeci',
      email: 'carrier@yolnext.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      userType: 'corporate',
      phone: '+90 555 987 6543',
      companyName: 'Demo Nakliye A.Ş.',
      taxNumber: '1234567890',
      isVerified: 1
    }
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO users 
    (firstName, lastName, email, password, userType, phone, companyName, taxNumber, isVerified) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  demoUsers.forEach(user => {
    stmt.run([
      user.firstName,
      user.lastName,
      user.email,
      user.password,
      user.userType,
      user.phone,
      user.companyName || null,
      user.taxNumber || null,
      user.isVerified
    ]);
  });

  stmt.finalize();

  // Demo gönderiler ekle
  const demoShipments = [
    {
      userId: 1,
      title: 'İstanbul - Ankara Kargo',
      description: 'Acil kargo gönderisi',
      pickupAddress: 'İstanbul, Beşiktaş',
      deliveryAddress: 'Ankara, Çankaya',
      pickupDate: '2024-10-20 10:00:00',
      weight: 5.5,
      dimensions: '50x30x20 cm',
      price: 150.00
    },
    {
      userId: 1,
      title: 'İzmir - Antalya Nakliye',
      description: 'Ev eşyası taşıma',
      pickupAddress: 'İzmir, Konak',
      deliveryAddress: 'Antalya, Muratpaşa',
      pickupDate: '2024-10-21 14:00:00',
      weight: 25.0,
      dimensions: '100x80x60 cm',
      price: 300.00
    }
  ];

  const shipmentStmt = db.prepare(`INSERT OR IGNORE INTO shipments 
    (userId, title, description, pickupAddress, deliveryAddress, pickupDate, weight, dimensions, price) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  demoShipments.forEach(shipment => {
    shipmentStmt.run([
      shipment.userId,
      shipment.title,
      shipment.description,
      shipment.pickupAddress,
      shipment.deliveryAddress,
      shipment.pickupDate,
      shipment.weight,
      shipment.dimensions,
      shipment.price
    ]);
  });

  shipmentStmt.finalize();

  console.log('✅ Database tabloları oluşturuldu');
  console.log('✅ Demo veriler eklendi');
  console.log('✅ SQLite database hazır!');
});

// Database bağlantısını kapat
db.close((err) => {
  if (err) {
    console.error('❌ Database kapatma hatası:', err.message);
  } else {
    console.log('✅ Database bağlantısı kapatıldı');
    console.log(`📁 Database dosyası: ${dbPath}`);
  }
});
