-- Audit Trail System Migration
-- Immutable logging system for critical operations

-- Main audit trail table
CREATE TABLE IF NOT EXISTS audit_trail (
    id BIGSERIAL PRIMARY KEY,
    
    -- User and action info
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'CREATE_SHIPMENT', 'ACCEPT_OFFER', 'TRANSFER_MONEY', 'DELETE_LISTING', etc.
    
    -- Entity information
    entity_type VARCHAR(50) NOT NULL, -- 'shipment', 'offer', 'user', 'payment', 'wallet', etc.
    entity_id VARCHAR(50), -- ID of the affected entity
    
    -- Change tracking
    old_values JSONB, -- Previous values (for updates/deletes)
    new_values JSONB, -- New values (for creates/updates)
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    
    -- Risk assessment
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}', -- Any additional context-specific data
    
    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Immutability - no updates or deletes allowed after creation
    CONSTRAINT audit_trail_immutable CHECK (created_at <= CURRENT_TIMESTAMP),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Critical financial operations audit
CREATE TABLE IF NOT EXISTS financial_audit_trail (
    id BIGSERIAL PRIMARY KEY,
    
    -- Transaction info
    user_id INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'COMMISSION_DEDUCTION', 'PAYMENT_TRANSFER', 'WALLET_CREDIT', 'REFUND'
    
    -- Amounts and currency
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    
    -- Wallet/account info
    from_wallet_id INTEGER,
    to_wallet_id INTEGER,
    
    -- Related entities
    related_shipment_id INTEGER,
    related_offer_id INTEGER,
    
    -- Financial verification
    balance_before DECIMAL(15,2),
    balance_after DECIMAL(15,2),
    
    -- Security
    authorization_code VARCHAR(100), -- Internal authorization code
    verification_hash TEXT, -- Hash for integrity verification
    
    -- Context
    initiated_by INTEGER NOT NULL, -- User ID who initiated the transaction
    approved_by INTEGER, -- Admin user ID if approval required
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'reversed'
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    
    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Immutability
    CONSTRAINT financial_audit_immutable CHECK (created_at <= CURRENT_TIMESTAMP),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- System operation audit (admin actions)
CREATE TABLE IF NOT EXISTS admin_audit_trail (
    id BIGSERIAL PRIMARY KEY,
    
    -- Admin info
    admin_user_id INTEGER NOT NULL,
    admin_action VARCHAR(100) NOT NULL,
    
    -- Target of action
    target_user_id INTEGER, -- If action is on a specific user
    target_entity_type VARCHAR(50),
    target_entity_id VARCHAR(50),
    
    -- Action details
    action_reason TEXT, -- Why this action was taken
    action_result TEXT, -- What was the outcome
    
    -- Data changes
    before_state JSONB,
    after_state JSONB,
    
    -- Authorization
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by INTEGER, -- Another admin who approved this action
    approval_timestamp TIMESTAMP,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    admin_panel_session VARCHAR(100),
    
    -- Risk and compliance
    risk_level VARCHAR(20) DEFAULT 'medium',
    compliance_flags TEXT[], -- Any compliance concerns
    
    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Security event audit
CREATE TABLE IF NOT EXISTS security_audit_trail (
    id BIGSERIAL PRIMARY KEY,
    
    -- Event info
    event_type VARCHAR(50) NOT NULL, -- 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'PASSWORD_CHANGE', 'SUSPICIOUS_ACTIVITY'
    user_id INTEGER, -- May be null for failed login attempts
    
    -- Security context
    ip_address INET NOT NULL,
    user_agent TEXT,
    geolocation JSONB, -- Country, city, etc.
    
    -- Event details
    event_data JSONB DEFAULT '{}',
    
    -- Risk assessment
    risk_score INTEGER DEFAULT 0, -- 0-100 risk score
    security_flags TEXT[], -- Array of security concerns
    
    -- Response actions
    action_taken VARCHAR(100), -- 'NONE', 'ACCOUNT_LOCKED', 'ADMIN_NOTIFIED', 'REQUIRE_2FA'
    
    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance and searching
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_risk_level ON audit_trail(risk_level);

CREATE INDEX IF NOT EXISTS idx_financial_audit_user_id ON financial_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_type ON financial_audit_trail(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_audit_created_at ON financial_audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_audit_amount ON financial_audit_trail(amount);
CREATE INDEX IF NOT EXISTS idx_financial_audit_status ON financial_audit_trail(status);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON admin_audit_trail(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target_user ON admin_audit_trail(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_trail(created_at);

CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_trail(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_ip ON security_audit_trail(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_trail(created_at);

-- Function to prevent modifications to audit tables
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'Audit trail kayıtları değiştirilemez. Immutable audit log violation.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit trail kayıtları silinemez. Immutable audit log violation.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply immutability triggers to all audit tables
DROP TRIGGER IF EXISTS prevent_audit_trail_modification ON audit_trail;
CREATE TRIGGER prevent_audit_trail_modification
    BEFORE UPDATE OR DELETE ON audit_trail
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS prevent_financial_audit_modification ON financial_audit_trail;
CREATE TRIGGER prevent_financial_audit_modification
    BEFORE UPDATE OR DELETE ON financial_audit_trail
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS prevent_admin_audit_modification ON admin_audit_trail;
CREATE TRIGGER prevent_admin_audit_modification
    BEFORE UPDATE OR DELETE ON admin_audit_trail
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS prevent_security_audit_modification ON security_audit_trail;
CREATE TRIGGER prevent_security_audit_modification
    BEFORE UPDATE OR DELETE ON security_audit_trail
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Function to create audit trail entry
CREATE OR REPLACE FUNCTION log_audit_trail(
    p_user_id INTEGER,
    p_action VARCHAR(100),
    p_entity_type VARCHAR(50),
    p_entity_id VARCHAR(50) DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_risk_level VARCHAR(20) DEFAULT 'low',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
    audit_id BIGINT;
BEGIN
    INSERT INTO audit_trail (
        user_id, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent,
        risk_level, metadata
    ) VALUES (
        p_user_id, p_action, p_entity_type, p_entity_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent,
        p_risk_level, p_metadata
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log financial transactions
CREATE OR REPLACE FUNCTION log_financial_transaction(
    p_user_id INTEGER,
    p_transaction_type VARCHAR(50),
    p_amount DECIMAL(15,2),
    p_from_wallet_id INTEGER DEFAULT NULL,
    p_to_wallet_id INTEGER DEFAULT NULL,
    p_related_shipment_id INTEGER DEFAULT NULL,
    p_related_offer_id INTEGER DEFAULT NULL,
    p_balance_before DECIMAL(15,2) DEFAULT NULL,
    p_balance_after DECIMAL(15,2) DEFAULT NULL,
    p_initiated_by INTEGER DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    financial_audit_id BIGINT;
    verification_string TEXT;
    verification_hash_result TEXT;
BEGIN
    -- Generate verification hash
    verification_string := p_user_id::text || p_transaction_type || p_amount::text || 
                          COALESCE(p_related_shipment_id::text, '') || 
                          EXTRACT(epoch FROM CURRENT_TIMESTAMP)::text;
    verification_hash_result := encode(digest(verification_string, 'sha256'), 'hex');
    
    INSERT INTO financial_audit_trail (
        user_id, transaction_type, amount, from_wallet_id, to_wallet_id,
        related_shipment_id, related_offer_id, balance_before, balance_after,
        initiated_by, verification_hash, ip_address, user_agent
    ) VALUES (
        p_user_id, p_transaction_type, p_amount, p_from_wallet_id, p_to_wallet_id,
        p_related_shipment_id, p_related_offer_id, p_balance_before, p_balance_after,
        COALESCE(p_initiated_by, p_user_id), verification_hash_result, p_ip_address, p_user_agent
    ) RETURNING id INTO financial_audit_id;
    
    RETURN financial_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR(50),
    p_user_id INTEGER DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}',
    p_risk_score INTEGER DEFAULT 0,
    p_security_flags TEXT[] DEFAULT NULL,
    p_action_taken VARCHAR(100) DEFAULT 'NONE'
)
RETURNS BIGINT AS $$
DECLARE
    security_audit_id BIGINT;
BEGIN
    INSERT INTO security_audit_trail (
        event_type, user_id, ip_address, user_agent,
        event_data, risk_score, security_flags, action_taken
    ) VALUES (
        p_event_type, p_user_id, p_ip_address, p_user_agent,
        p_event_data, p_risk_score, p_security_flags, p_action_taken
    ) RETURNING id INTO security_audit_id;
    
    RETURN security_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Create a view for audit trail summary (for admin dashboard)
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
    DATE(created_at) as audit_date,
    action,
    entity_type,
    risk_level,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users
FROM audit_trail
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), action, entity_type, risk_level
ORDER BY audit_date DESC, action_count DESC;

-- Create view for financial audit summary
CREATE OR REPLACE VIEW financial_audit_summary AS
SELECT 
    DATE(created_at) as transaction_date,
    transaction_type,
    status,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    COUNT(DISTINCT user_id) as unique_users
FROM financial_audit_trail
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), transaction_type, status
ORDER BY transaction_date DESC, total_amount DESC;
