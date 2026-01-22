-- 004_fix_demo_drivers.sql
-- KRİTİK FİX: Demo nakliyeci için gerçekçi taşıyıcı verileri ekleme

BEGIN;

-- Önce demo nakliyeci ID'sini bul (user_type = 'nakliyeci' olan demo hesap)
-- Demo nakliyeci için 3 tane gerçekçi taşıyıcı ekle

DO $$
DECLARE
    demo_nakliyeci_id INTEGER;
BEGIN
    -- Demo nakliyeci ID'sini bul
    SELECT id INTO demo_nakliyeci_id 
    FROM users 
    WHERE email LIKE '%demo.nakliyeci%' OR user_type = 'nakliyeci'
    LIMIT 1;

    IF demo_nakliyeci_id IS NOT NULL THEN
        -- Mevcut N/A driver kayıtlarını temizle
        DELETE FROM drivers WHERE name = 'N/A' OR vehicle_plate LIKE '%N/A%';
        
        -- Demo taşıyıcılar ekle
        INSERT INTO drivers (name, phone, email, nakliyeci_id, vehicle_type, vehicle_plate, license_class, status, rating, total_shipments, created_at, updated_at) VALUES
        ('Mehmet Yılmaz', '+90 532 123 4567', 'mehmet.tasiyici@yolnext.com', demo_nakliyeci_id, 'Kamyonet', '34 ABC 123', 'B', 'available', 4.8, 145, NOW(), NOW()),
        ('Ali Demir', '+90 534 234 5678', 'ali.tasiyici@yolnext.com', demo_nakliyeci_id, 'Kamyon', '06 DEF 456', 'C1', 'available', 4.6, 98, NOW(), NOW()),
        ('Fatma Kaya', '+90 535 345 6789', 'fatma.tasiyici@yolnext.com', demo_nakliyeci_id, 'Minibüs', '35 GHI 789', 'D1', 'busy', 4.9, 203, NOW(), NOW());

        RAISE NOTICE 'Demo taşıyıcılar başarıyla eklendi (nakliyeci_id: %)', demo_nakliyeci_id;
    ELSE
        RAISE NOTICE 'Demo nakliyeci bulunamadı, taşıyıcı eklenemedi';
    END IF;
END $$;

COMMIT;

-- Demo Taşıyıcı Profilleri:
-- 1. Mehmet Yılmaz - 34 Kamyonet - Deneyimli şehir içi taşıyıcı
-- 2. Ali Demir - 06 Kamyon - Şehirlerarası ağır yük uzmanı  
-- 3. Fatma Kaya - 35 Minibüs - Profesyonel ev taşıma uzmanı
