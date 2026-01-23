-- Admin Panel Systems Database Migration
-- Creates tables for: Disputes, Suspicious Activities, Financial Transparency, Admin Notifications
-- YolNext Admin Panel "Yönetim Merkezi" Database Schema

-- =============================================
-- DISPUTES SYSTEM TABLES
-- =============================================

-- Main disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    dispute_ref VARCHAR(50) UNIQUE NOT NULL,
    shipment_id INTEGER REFERENCES shipments(id),
    complainant_id INTEGER NOT NULL REFERENCES users(id),
    respondent_id INTEGER NOT NULL REFERENCES users(id),
    dispute_type VARCHAR(20) NOT NULL CHECK (dispute_type IN ('payment', 'delivery', 'damage', 'delay', 'fraud', 'communication', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'investigating', 'mediating', 'resolved', 'escalated', 'closed')) DEFAULT 'pending',
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    resolution_notes TEXT,
    resolution_amount DECIMAL(10,2),
    assigned_to INTEGER REFERENCES users(id),
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispute activities timeline
CREATE TABLE IF NOT EXISTS dispute_activities (
    id SERIAL PRIMARY KEY,
    dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispute messages/communications
CREATE TABLE IF NOT EXISTS dispute_messages (
    id SERIAL PRIMARY KEY,
    dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    recipient_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SUSPICIOUS ACTIVITIES SYSTEM TABLES
-- =============================================

-- Main suspicious activities table
CREATE TABLE IF NOT EXISTS suspicious_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('rapid_offers', 'unusual_pricing', 'account_takeover', 'fake_shipments', 'payment_fraud', 'location_anomaly', 'repeated_disputes', 'bulk_registration')),
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    details TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive')) DEFAULT 'active',
    resolution_notes TEXT,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- FINANCIAL TRANSPARENCY SYSTEM TABLES
-- =============================================

-- Main financial transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
    id SERIAL PRIMARY KEY,
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    shipment_id INTEGER REFERENCES shipments(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('commission', 'refund', 'payout', 'penalty', 'bonus', 'adjustment', 'escrow_hold', 'escrow_release')),
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'disputed')) DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    processing_notes TEXT,
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ADMIN NOTIFICATIONS SYSTEM TABLES
-- =============================================

-- Individual admin notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('user_banned', 'user_unbanned', 'dispute_resolved', 'payment_processed', 'system_maintenance', 'security_alert', 'policy_update', 'urgent_action', 'bulk_action')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    delivery_channels JSONB DEFAULT '["in_app"]'::jsonb,
    delivery_results JSONB DEFAULT '{}'::jsonb,
    scheduled_for TIMESTAMP,
    delivered_at TIMESTAMP,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    broadcast_id INTEGER,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'scheduled', 'delivered', 'partially_delivered', 'failed')) DEFAULT 'pending',
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Broadcast campaigns
CREATE TABLE IF NOT EXISTS admin_broadcasts (
    id SERIAL PRIMARY KEY,
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    target_groups JSONB DEFAULT '[]'::jsonb,
    target_conditions JSONB DEFAULT '{}'::jsonb,
    target_user_count INTEGER DEFAULT 0,
    processed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    delivery_channels JSONB DEFAULT '["in_app"]'::jsonb,
    scheduled_for TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'scheduled', 'processing', 'completed', 'partially_completed', 'failed')) DEFAULT 'pending',
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_complainant ON disputes(complainant_id);
CREATE INDEX IF NOT EXISTS idx_disputes_respondent ON disputes(respondent_id);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned_to ON disputes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at);
CREATE INDEX IF NOT EXISTS idx_disputes_shipment ON disputes(shipment_id);

-- Suspicious activities indexes
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user ON suspicious_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_risk_level ON suspicious_activities(risk_level);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_status ON suspicious_activities(status);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_activity_type ON suspicious_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_created_at ON suspicious_activities(created_at);

-- Financial transactions indexes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON financial_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_amount ON financial_transactions(amount);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_shipment ON financial_transactions(shipment_id);

-- Admin notifications indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user ON admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_broadcast ON admin_notifications(broadcast_id);

-- Admin broadcasts indexes
CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_status ON admin_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_created_at ON admin_broadcasts(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_type ON admin_broadcasts(notification_type);

-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================

-- Add foreign key constraint for admin_notifications.broadcast_id
ALTER TABLE admin_notifications 
ADD CONSTRAINT fk_admin_notifications_broadcast 
FOREIGN KEY (broadcast_id) REFERENCES admin_broadcasts(id) ON DELETE SET NULL;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_disputes_updated_at 
    BEFORE UPDATE ON disputes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suspicious_activities_updated_at 
    BEFORE UPDATE ON suspicious_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at 
    BEFORE UPDATE ON financial_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Note: Sample data would be inserted only in development environment
-- This section would be populated by separate seed scripts

-- =============================================
-- PERMISSIONS AND SECURITY
-- =============================================

-- Grant appropriate permissions to application user
-- (These would be adjusted based on actual database user setup)

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO yolnext_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO yolnext_app_user;

-- =============================================
-- VIEWS FOR ADMIN PANEL
-- =============================================

-- Comprehensive dispute view with user details
CREATE OR REPLACE VIEW admin_dispute_details AS
SELECT 
    d.*,
    complainant.email AS complainant_email,
    complainant."fullName" AS complainant_name,
    complainant.role AS complainant_role,
    respondent.email AS respondent_email,
    respondent."fullName" AS respondent_name,
    respondent.role AS respondent_role,
    assigned_admin.email AS assigned_admin_email,
    resolved_admin.email AS resolved_admin_email,
    s.id AS shipment_tracking_number
FROM disputes d
LEFT JOIN users complainant ON d.complainant_id = complainant.id
LEFT JOIN users respondent ON d.respondent_id = respondent.id
LEFT JOIN users assigned_admin ON d.assigned_to = assigned_admin.id
LEFT JOIN users resolved_admin ON d.resolved_by = resolved_admin.id
LEFT JOIN shipments s ON d.shipment_id = s.id;

-- Financial transaction summary view
CREATE OR REPLACE VIEW admin_financial_summary AS
SELECT 
    ft.*,
    u.email AS user_email,
    u.role AS user_role,
    u."fullName" AS user_name,
    processed_by_user.email AS processed_by_email,
    s.id AS shipment_tracking_number
FROM financial_transactions ft
LEFT JOIN users u ON ft.user_id = u.id
LEFT JOIN users processed_by_user ON ft.processed_by = processed_by_user.id
LEFT JOIN shipments s ON ft.shipment_id = s.id;

-- Suspicious activity dashboard view
CREATE OR REPLACE VIEW admin_suspicious_activity_dashboard AS
SELECT 
    sa.*,
    u.email AS user_email,
    u.role AS user_role,
    u."fullName" AS user_name,
    u."createdAt" AS user_created_at,
    resolved_admin.email AS resolved_by_email
FROM suspicious_activities sa
LEFT JOIN users u ON sa.user_id = u.id
LEFT JOIN users resolved_admin ON sa.resolved_by = resolved_admin.id;
