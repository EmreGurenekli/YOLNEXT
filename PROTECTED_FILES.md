# Korunan Dosyalar ve Klasörler

Bu dosyalar kritik yapılandırma ve sayfa dosyalarıdır. Değiştirilmeden önce onay alınmalıdır.

## Kritik Sayfa Dosyaları

### Sidebar ve Navigation
- `src/components/navigation/NakliyeciSidebar.tsx`
- `src/components/navigation/TasiyiciSidebar.tsx`
- `src/components/navigation/CorporateSidebar.tsx`
- `src/components/navigation/IndividualSidebar.tsx`

### Route Tanımları
- `src/App.tsx` (Route tanımları)

### Ana Sayfalar
- `src/pages/nakliyeci/ActiveShipments.tsx`
- `src/pages/nakliyeci/Listings.tsx`
- `src/pages/nakliyeci/Jobs.tsx`
- `src/pages/tasiyici/Market.tsx`
- `src/pages/tasiyici/MyOffers.tsx`
- `src/pages/tasiyici/ActiveJobs.tsx`

## Değişiklik Yapmadan Önce

1. Bu dosyalarda değişiklik yapmadan önce mevcut durumu commit edin
2. Değişiklikleri test edin
3. Geri alınabilir bir commit yapın (git commit --no-verify ile bypass edilmemeli)

## Koruma Stratejisi

- Bu dosyalar stable branch'te korunmalıdır
- Production'a geçmeden önce mutlaka review edilmelidir

