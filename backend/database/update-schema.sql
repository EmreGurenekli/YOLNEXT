-- YolNext Kargo Platform - Güncellenmiş Veritabanı Şeması

-- Şehirler tablosu
CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cüzdanlar tablosu
CREATE TABLE IF NOT EXISTS wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- İşlemler tablosu
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'withdraw', 'commission'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  payment_method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mesajlar tablosu
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  shipment_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

-- Puanlar tablosu
CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rater_id INTEGER NOT NULL,
  rated_user_id INTEGER NOT NULL,
  shipment_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rater_id) REFERENCES users(id),
  FOREIGN KEY (rated_user_id) REFERENCES users(id),
  FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

-- Kullanıcılar tablosunu güncelle
ALTER TABLE users ADD COLUMN city_id INTEGER;
ALTER TABLE users ADD COLUMN phone_visible BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0;

-- Gönderiler tablosunu güncelle
ALTER TABLE shipments ADD COLUMN pickup_city_id INTEGER;
ALTER TABLE shipments ADD COLUMN delivery_city_id INTEGER;
ALTER TABLE shipments ADD COLUMN nakliyeci_id INTEGER;

-- Teklifler tablosunu güncelle
ALTER TABLE offers ADD COLUMN estimated_delivery TEXT;
ALTER TABLE offers ADD COLUMN message TEXT;
ALTER TABLE offers ADD COLUMN accepted_at DATETIME;
ALTER TABLE offers ADD COLUMN rejected_at DATETIME;

-- Şehir verilerini ekle
INSERT OR IGNORE INTO cities (name, latitude, longitude) VALUES
('İstanbul', 41.0082, 28.9784),
('Ankara', 39.9334, 32.8597),
('İzmir', 38.4192, 27.1287),
('Bursa', 40.1826, 29.0665),
('Antalya', 36.8969, 30.7133),
('Adana', 37.0000, 35.3213),
('Konya', 37.8667, 32.4833),
('Gaziantep', 37.0662, 37.3833),
('Mersin', 36.8000, 34.6333),
('Diyarbakır', 37.9144, 40.2306);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_shipment_id ON messages(shipment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user_id ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_city ON shipments(pickup_city_id);
CREATE INDEX IF NOT EXISTS idx_offers_nakliyeci ON offers(nakliyeci_id);
CREATE INDEX IF NOT EXISTS idx_offers_shipment ON offers(shipment_id);

