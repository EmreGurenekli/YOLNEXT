-- YolNext Complete Database Schema
-- This file contains all necessary tables for the complete system

-- Users table (already exists, but adding missing fields)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('individual', 'corporate', 'nakliyeci', 'tasiyici')),
    company_name TEXT,
    tax_number TEXT,
    address TEXT,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shipments table (already exists, but adding missing fields)
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    weight REAL,
    dimensions TEXT, -- JSON string for length, width, height
    price REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_transit', 'delivered', 'cancelled')),
    category TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Offers table (already exists)
CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL,
    nakliyeci_id TEXT NOT NULL,
    price REAL NOT NULL,
    message TEXT,
    estimated_delivery TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (nakliyeci_id) REFERENCES users(id)
);

-- Agreements table (NEW)
CREATE TABLE IF NOT EXISTS agreements (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    nakliyeci_id TEXT NOT NULL,
    offer_id TEXT NOT NULL,
    price REAL NOT NULL,
    commission_rate REAL DEFAULT 0.01, -- 1% commission
    commission_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'active', 'completed', 'cancelled')),
    terms TEXT, -- JSON string for additional terms
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (nakliyeci_id) REFERENCES users(id),
    FOREIGN KEY (offer_id) REFERENCES offers(id)
);

-- Tracking updates table (NEW)
CREATE TABLE IF NOT EXISTS tracking_updates (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL,
    status TEXT NOT NULL,
    location TEXT,
    latitude REAL,
    longitude REAL,
    description TEXT,
    updated_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Commissions table (NEW)
CREATE TABLE IF NOT EXISTS commissions (
    id TEXT PRIMARY KEY,
    agreement_id TEXT NOT NULL,
    nakliyeci_id TEXT NOT NULL,
    amount REAL NOT NULL,
    rate REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id),
    FOREIGN KEY (nakliyeci_id) REFERENCES users(id)
);

-- Messages table (NEW)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    shipment_id TEXT,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

-- Notifications table (NEW)
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON string for additional data
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Wallets table (NEW)
CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    balance REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Transactions table (NEW)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'commission', 'refund')),
    amount REAL NOT NULL,
    description TEXT,
    reference_id TEXT, -- Reference to shipment, agreement, etc.
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- User sessions table (NEW)
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Password reset tokens table (NEW)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Email verification tokens table (NEW)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System settings table (NEW)
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (id, key, value, description) VALUES
('1', 'commission_rate', '0.01', 'Default commission rate (1%)'),
('2', 'min_shipment_price', '50.0', 'Minimum shipment price'),
('3', 'max_shipment_price', '10000.0', 'Maximum shipment price'),
('4', 'currency', 'TRY', 'Default currency'),
('5', 'timezone', 'Europe/Istanbul', 'Default timezone');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_offers_shipment_id ON offers(shipment_id);
CREATE INDEX IF NOT EXISTS idx_offers_nakliyeci_id ON offers(nakliyeci_id);
CREATE INDEX IF NOT EXISTS idx_agreements_sender_id ON agreements(sender_id);
CREATE INDEX IF NOT EXISTS idx_agreements_nakliyeci_id ON agreements(nakliyeci_id);
CREATE INDEX IF NOT EXISTS idx_tracking_shipment_id ON tracking_updates(shipment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);