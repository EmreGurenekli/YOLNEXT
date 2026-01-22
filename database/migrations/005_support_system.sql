-- Support/Ticket System Migration
-- Professional customer support infrastructure

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'individual', 'corporate', 'nakliyeci', 'tasiyici'
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(20),
    
    -- Ticket details
    category VARCHAR(50) NOT NULL, -- 'technical', 'payment', 'shipment', 'account', 'other'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'
    
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    
    -- Context information
    related_shipment_id INTEGER, -- Reference to shipment if applicable
    related_offer_id INTEGER, -- Reference to offer if applicable
    related_transaction_id VARCHAR(100), -- Reference to payment/transaction if applicable
    browser_info TEXT, -- User agent, screen resolution, etc.
    url_context VARCHAR(500), -- Page URL where issue occurred
    
    -- Admin handling
    assigned_admin_id INTEGER, -- Which admin is handling this
    admin_notes TEXT, -- Internal admin notes
    
    -- Resolution
    resolution_summary TEXT,
    resolution_category VARCHAR(50), -- 'user_error', 'system_bug', 'feature_request', 'policy_clarification'
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_response_at TIMESTAMP, -- When admin first responded
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- Metadata
    is_escalated BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT,
    customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating >= 1 AND customer_satisfaction_rating <= 5),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Support ticket messages/responses
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- 'user' or 'admin'
    sender_id INTEGER NOT NULL, -- user_id or admin_id
    sender_name VARCHAR(255) NOT NULL,
    
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'message', -- 'message', 'status_change', 'internal_note'
    
    -- Attachments
    attachments JSONB, -- Array of file references
    
    -- Status tracking
    is_internal BOOLEAN DEFAULT FALSE, -- Admin-only internal notes
    is_auto_generated BOOLEAN DEFAULT FALSE, -- System-generated messages
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- Support ticket attachments
CREATE TABLE IF NOT EXISTS support_ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    message_id INTEGER, -- NULL if attached to ticket directly
    
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    
    uploaded_by_id INTEGER NOT NULL,
    uploaded_by_type VARCHAR(20) NOT NULL, -- 'user' or 'admin'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES support_ticket_messages(id) ON DELETE CASCADE
);

-- Support categories and templates
CREATE TABLE IF NOT EXISTS support_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER, -- For subcategories
    
    -- Auto-response templates
    auto_response_template TEXT,
    expected_response_time_hours INTEGER DEFAULT 24,
    
    -- Routing
    default_assignee_role VARCHAR(50), -- 'support_tier1', 'support_tier2', 'technical', 'financial'
    requires_escalation BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES support_categories(id) ON DELETE SET NULL
);

-- Support knowledge base
CREATE TABLE IF NOT EXISTS support_kb_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category_id INTEGER,
    
    -- SEO and search
    slug VARCHAR(500) UNIQUE NOT NULL,
    meta_description VARCHAR(500),
    keywords TEXT, -- Comma-separated
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    helpfulness_score DECIMAL(3,2) DEFAULT 0, -- Average rating 1-5
    total_ratings INTEGER DEFAULT 0,
    
    -- Author info
    author_id INTEGER NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES support_categories(id) ON DELETE SET NULL
);

-- User reference system for quick support lookup
CREATE TABLE IF NOT EXISTS user_support_references (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    
    -- Quick reference codes
    support_reference_code VARCHAR(10) UNIQUE NOT NULL, -- YN-12345 format
    phone_verification_code VARCHAR(6), -- 6-digit phone verification for support calls
    
    -- Support history summary
    total_tickets INTEGER DEFAULT 0,
    resolved_tickets INTEGER DEFAULT 0,
    average_resolution_time_hours DECIMAL(8,2),
    last_contact_date TIMESTAMP,
    
    -- VIP/Priority status
    is_vip_customer BOOLEAN DEFAULT FALSE,
    priority_level INTEGER DEFAULT 1, -- 1=normal, 2=priority, 3=vip
    priority_reason TEXT,
    
    -- Account verification for support
    identity_verified BOOLEAN DEFAULT FALSE,
    identity_verification_date TIMESTAMP,
    identity_verification_method VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_admin ON support_tickets(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON support_ticket_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_user_support_references_reference_code ON user_support_references(support_reference_code);
CREATE INDEX IF NOT EXISTS idx_user_support_references_phone_code ON user_support_references(phone_verification_code);

CREATE INDEX IF NOT EXISTS idx_support_kb_articles_status ON support_kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_support_kb_articles_category ON support_kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_support_kb_articles_slug ON support_kb_articles(slug);

-- Insert default support categories
INSERT INTO support_categories (name, description, auto_response_template, expected_response_time_hours, default_assignee_role) VALUES
('Teknik Destek', 'Platform kullanımı, hata raporları, performans sorunları', 
 'Sayın müşterimiz, teknik destek talebinizi aldık. Teknik ekibimiz konunuzu inceleyerek en kısa sürede size dönüş yapacaktır.', 
 4, 'technical'),
 
('Ödeme ve Faturalandırma', 'Ödeme sorunları, komisyon hesaplamaları, fatura talepleri', 
 'Sayın müşterimiz, ödeme ile ilgili talebinizi aldık. Mali işler ekibimiz konunuzu inceleyerek 2 iş günü içinde size dönüş yapacaktır.', 
 24, 'financial'),
 
('Gönderi ve Taşıma', 'Gönderi takibi, nakliyeci sorunları, teslimat problemleri', 
 'Sayın müşterimiz, gönderi ile ilgili talebinizi aldık. Operasyon ekibimiz konunuzu inceleyerek 2 saat içinde size dönüş yapacaktır.', 
 2, 'support_tier1'),
 
('Hesap Yönetimi', 'Profil güncelleme, şifre sıfırlama, hesap doğrulama', 
 'Sayın müşterimiz, hesap yönetimi ile ilgili talebinizi aldık. Müşteri hizmetleri ekibimiz size 1 saat içinde dönüş yapacaktır.', 
 1, 'support_tier1'),
 
('Diğer', 'Genel sorular, öneriler, şikayetler', 
 'Sayın müşterimiz, talebinizi aldık. Müşteri hizmetleri ekibimiz konunuzu değerlendirerek size dönüş yapacaktır.', 
 8, 'support_tier1');

-- Auto-generate user reference codes for existing users
INSERT INTO user_support_references (user_id, support_reference_code, phone_verification_code)
SELECT 
    id,
    'YN-' || LPAD(id::text, 5, '0'),
    LPAD((RANDOM() * 999999)::int::text, 6, '0')
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_support_references WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Function to auto-generate reference codes for new users
CREATE OR REPLACE FUNCTION generate_user_support_reference()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_support_references (user_id, support_reference_code, phone_verification_code)
    VALUES (
        NEW.id,
        'YN-' || LPAD(NEW.id::text, 5, '0'),
        LPAD((RANDOM() * 999999)::int::text, 6, '0')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference codes
DROP TRIGGER IF EXISTS trigger_generate_user_support_reference ON users;
CREATE TRIGGER trigger_generate_user_support_reference
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_user_support_reference();

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    ticket_num TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        ticket_num := 'TKT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::text, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM support_tickets WHERE ticket_number = ticket_num) THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
    END LOOP;
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update ticket timestamps
CREATE OR REPLACE FUNCTION update_ticket_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Set first_response_at when admin first responds
    IF OLD.first_response_at IS NULL AND NEW.status != 'open' THEN
        NEW.first_response_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Set resolved_at when status changes to resolved
    IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
        NEW.resolved_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Set closed_at when status changes to closed
    IF OLD.status != 'closed' AND NEW.status = 'closed' THEN
        NEW.closed_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket timestamp updates
DROP TRIGGER IF EXISTS trigger_update_ticket_timestamps ON support_tickets;
CREATE TRIGGER trigger_update_ticket_timestamps
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamps();
