-- Yasal Uyumluluk İçin Kritik Tablolar
-- KVKK, Tüketici Hakları ve Mesafeli Satış Sözleşmesi için gerekli tablolar

-- 1. Kullanıcı Onayları Tablosu (KVKK m.5 - Açık Rıza)
-- KVKK uyumluluğu için kullanıcı onaylarının tarih, saat, IP adresi ile saklanması zorunludur
CREATE TABLE IF NOT EXISTS user_consents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Onay türleri
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'terms_of_service',
        'privacy_policy',
        'cookie_policy',
        'kvkk_consent',
        'marketing_consent',
        'sms_consent',
        'email_consent',
        'distance_selling_contract'
    )),
    
    -- Onay durumu
    is_accepted BOOLEAN NOT NULL DEFAULT true,
    
    -- KVKK gereği: Onayın alındığı bilgiler
    consent_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- IPv4 veya IPv6
    user_agent TEXT, -- Tarayıcı bilgisi
    document_version VARCHAR(50), -- Hangi versiyon kabul edildi (örn: "v1.0-2024")
    
    -- Onay iptali (KVKK m.7 - Silme Hakkı)
    revoked_at TIMESTAMP,
    revocation_ip_address VARCHAR(45),
    revocation_user_agent TEXT,
    
    -- Metadata
    metadata JSONB, -- Ek bilgiler
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_date ON user_consents(consent_date);

-- 2. Sözleşme İmzalama Tablosu
-- Kullanıcıların sözleşmeleri imzaladığının kanıtı (elektronik imza)
CREATE TABLE IF NOT EXISTS contract_signatures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sözleşme türü
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN (
        'user_agreement',
        'distance_selling',
        'payment_agreement',
        'service_agreement',
        'carrier_agreement'
    )),
    
    -- Sözleşme içeriği (hash ile saklanır - değişiklik tespiti için)
    contract_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
    contract_version VARCHAR(50) NOT NULL,
    contract_content_hash TEXT, -- Sözleşme metninin hash'i
    
    -- İmza bilgileri
    signature_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Elektronik imza (KVKK ve e-imza kanunu uyumlu)
    electronic_signature TEXT, -- İmza token/hash
    signature_method VARCHAR(50) DEFAULT 'click_to_sign', -- 'click_to_sign', 'e_signature', 'sms_verification'
    
    -- İptal/İptal
    revoked_at TIMESTAMP,
    revocation_reason TEXT,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_contract_signatures_user_id ON contract_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_type ON contract_signatures(contract_type);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_signature_date ON contract_signatures(signature_date);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_hash ON contract_signatures(contract_hash);

-- 3. Veri İşleme Kayıtları (KVKK m.5 - Veri İşleme Kayıtları)
-- KVKK m.5 gereği veri işleme faaliyetlerinin kaydı tutulmalıdır
CREATE TABLE IF NOT EXISTS data_processing_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- İşlem türü
    processing_type VARCHAR(50) NOT NULL CHECK (processing_type IN (
        'data_collection',
        'data_storage',
        'data_access',
        'data_modification',
        'data_deletion',
        'data_export',
        'data_sharing',
        'data_transfer'
    )),
    
    -- İşlenen veri türü
    data_category VARCHAR(50) NOT NULL, -- 'personal_info', 'payment_info', 'location_data', etc.
    
    -- İşlem detayları
    processing_purpose TEXT NOT NULL, -- KVKK m.5 - İşleme amacı
    legal_basis VARCHAR(50) NOT NULL, -- KVKK m.5 - Hukuki sebep
    description TEXT,
    
    -- İşlem zamanı
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_by INTEGER REFERENCES users(id), -- Sistem kullanıcısı veya admin
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_data_processing_logs_user_id ON data_processing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_processing_logs_processing_type ON data_processing_logs(processing_type);
CREATE INDEX IF NOT EXISTS idx_data_processing_logs_processed_at ON data_processing_logs(processed_at);

-- 4. Veri Silme İstekleri (KVKK m.7 - Silme Hakkı)
-- Kullanıcıların veri silme taleplerinin kaydı
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Talep durumu
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'rejected',
        'partially_completed'
    )),
    
    -- Talep detayları
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_ip_address VARCHAR(45),
    request_user_agent TEXT,
    request_reason TEXT,
    
    -- İşlem detayları
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    processing_notes TEXT,
    
    -- Red nedeni (eğer reddedildiyse)
    rejection_reason TEXT,
    rejection_legal_basis TEXT, -- KVKK m.7 - Red sebepleri
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_request_date ON data_deletion_requests(request_date);

-- 5. Kullanıcılar tablosuna eksik alanlar ekle
-- Doğum tarihi (18 yaş kontrolü için)
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
-- KVKK gereği: Veri saklama süresi bilgisi
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMP;
-- KVKK gereği: Veri silme talebi var mı?
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP;
-- KVKK gereği: Veri silme nedeni
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- 6. Ödeme Sözleşmeleri Tablosu
-- Ödeme yapılırken ayrı bir sözleşme imzalanması için
CREATE TABLE IF NOT EXISTS payment_agreements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER, -- orders tablosuna referans (eğer varsa)
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    
    -- Ödeme detayları
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    payment_method VARCHAR(50) NOT NULL,
    
    -- Sözleşme bilgileri
    agreement_hash VARCHAR(64) NOT NULL,
    agreement_version VARCHAR(50) NOT NULL,
    signature_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Ödeme durumu
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
        'pending',
        'completed',
        'failed',
        'refunded',
        'cancelled'
    )),
    
    -- Mesafeli Satış Sözleşmesi bilgileri (6502 sayılı Kanun)
    distance_selling_contract_accepted BOOLEAN DEFAULT false,
    distance_selling_contract_date TIMESTAMP,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_payment_agreements_user_id ON payment_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_agreements_shipment_id ON payment_agreements(shipment_id);
CREATE INDEX IF NOT EXISTS idx_payment_agreements_signature_date ON payment_agreements(signature_date);

-- 7. Şikayet ve Anlaşmazlık Kayıtları
-- Tüketici hakları ve anlaşmazlık çözümü için
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Şikayet edilen kullanıcı
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    order_id INTEGER, -- orders tablosuna referans
    
    -- Şikayet türü
    complaint_type VARCHAR(50) NOT NULL CHECK (complaint_type IN (
        'service_quality',
        'payment_issue',
        'delivery_problem',
        'damage',
        'delay',
        'fraud',
        'other'
    )),
    
    -- Şikayet detayları
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requested_resolution TEXT,
    
    -- Durum
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'reviewing',
        'resolved',
        'rejected',
        'escalated'
    )),
    
    -- İşlem bilgileri
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_ip_address VARCHAR(45),
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolution_notes TEXT,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_related_user_id ON complaints(related_user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_shipment_id ON complaints(shipment_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_submitted_at ON complaints(submitted_at);

-- 8. Audit Log (Denetim Kayıtları)
-- Tüm kritik işlemlerin kaydı (yasal uyumluluk için)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- İşlem türü
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'shipment', 'payment', etc.
    entity_id INTEGER,
    
    -- İşlem detayları
    action_description TEXT NOT NULL,
    old_values JSONB, -- Değişiklik öncesi değerler
    new_values JSONB, -- Değişiklik sonrası değerler
    
    -- İşlem bilgileri
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    performed_by INTEGER REFERENCES users(id), -- Sistem kullanıcısı
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at);

-- 9. Yasal Doküman Versiyonları
-- Sözleşmelerin versiyonlarını takip etmek için
CREATE TABLE IF NOT EXISTS legal_document_versions (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'terms_of_service',
        'privacy_policy',
        'cookie_policy',
        'kvkk_aydinlatma',
        'distance_selling_contract',
        'consumer_rights_info'
    )),
    
    -- Versiyon bilgileri
    version VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    content_hash VARCHAR(64) NOT NULL, -- Doküman içeriğinin hash'i
    
    -- Doküman içeriği (opsiyonel - büyük metinler için ayrı tablo kullanılabilir)
    content TEXT,
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(document_type, version)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_legal_document_versions_document_type ON legal_document_versions(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_document_versions_effective_date ON legal_document_versions(effective_date);

-- 10. Kullanıcı Veri Erişim İstekleri (KVKK m.11 - Erişim Hakkı)
CREATE TABLE IF NOT EXISTS data_access_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Talep durumu
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'rejected'
    )),
    
    -- Talep detayları
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_ip_address VARCHAR(45),
    request_user_agent TEXT,
    
    -- İşlem detayları
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    data_export_url TEXT, -- Veri dışa aktarma dosyası URL'i
    data_export_expires_at TIMESTAMP, -- Link'in geçerlilik süresi
    
    -- Metadata
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_data_access_requests_user_id ON data_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_requests_status ON data_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_access_requests_request_date ON data_access_requests(request_date);





































