-- 003_unify_shipment_status.sql
-- KRİTİK FİX: Shipments ve Orders status tutarsızlığını gidermek için unified status sistemi

BEGIN;

-- Önce mevcut 'active' durumundaki shipment'ları 'confirmed' yap
UPDATE shipments 
SET status = 'confirmed' 
WHERE status = 'active';

-- 'draft' durum korunacak (kullanıcı henüz yayınlamamış)
-- 'in_progress' -> 'in_progress' (aynı kalacak)
-- 'completed' -> 'delivered' (daha spesifik)
UPDATE shipments 
SET status = 'delivered' 
WHERE status = 'completed';

-- Shipments tablosunun status constraint'ini güncelle
ALTER TABLE shipments 
DROP CONSTRAINT IF EXISTS shipments_status_check;

ALTER TABLE shipments 
ADD CONSTRAINT shipments_status_check 
CHECK (status IN ('draft', 'confirmed', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'disputed'));

-- Shipments status varsayılan değerini güncelle
ALTER TABLE shipments 
ALTER COLUMN status SET DEFAULT 'draft';

COMMIT;

-- Status Mapping Guide:
-- OLD -> NEW
-- 'active' -> 'confirmed' (teklif kabul edilmiş, onaylanmış)
-- 'completed' -> 'delivered' (teslim edilmiş)
-- 'draft' -> 'draft' (taslak, henüz yayınlanmamış)
-- 'in_progress' -> 'in_progress' (işlem devam ediyor)
-- 'cancelled' -> 'cancelled' (iptal edilmiş)

-- Yeni Unified Status Machine:
-- 1. draft: Kullanıcı taslak oluşturdu, henüz yayınlamadı
-- 2. confirmed: Gönderi yayınlandı, teklif kabul edildi
-- 3. in_progress: Taşıyıcı atandı, işlem başladı
-- 4. picked_up: Yük toplandı, nakliye başladı
-- 5. in_transit: Yolda, teslimat adresine gidiyor
-- 6. delivered: Teslim edildi
-- 7. cancelled: İptal edildi
-- 8. disputed: Anlaşmazlık var
