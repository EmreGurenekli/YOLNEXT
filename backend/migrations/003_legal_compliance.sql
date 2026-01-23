-- Yasal Uyumluluk İçin Kritik Tablolar
-- KVKK, Tüketici Hakları ve Mesafeli Satış Sözleşmesi için gerekli tablolar

-- 1. Kullanıcı Onayları Tablosu (KVKK m.5 - Açık Rıza)
-- KVKK uyumluluğu için kullanıcı onaylarının tarih, saat, IP adresi ile saklanması zorunludur
CREATE TABLE IF NOT EXISTS user_consents (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    
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
