# 🚛 YolNet Kargo Pazar Yeri

## 📋 Proje Özeti
YolNet, Türkiye'nin en kapsamlı kargo pazar yeridir. Bireysel kullanıcılardan büyük şirketlere, nakliyecilerden taşıyıcılara kadar tüm kargo ihtiyaçlarını karşılayan entegre platform.

## 🏗️ Mimari
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + SQLite
- **UI Framework:** Tailwind CSS + Custom Components
- **State Management:** React Context API
- **Authentication:** JWT Token

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- npm 9+

### Kurulum
```bash
# Bağımlılıkları yükle
npm install

# Backend'i başlat
npm run dev:backend

# Frontend'i başlat (yeni terminal)
npm run dev:frontend
```

### Demo Hesaplar
- **Bireysel:** demo@individual.com
- **Kurumsal:** demo@corporate.com
- **Nakliyeci:** demo@carrier.com
- **Taşıyıcı:** demo@driver.com

## 📁 Proje Yapısı

```
yolnet-kargo/
├── 📁 backend/                 # Backend API
│   ├── 📁 models/             # Veritabanı modelleri
│   ├── 📁 routes/             # API endpoint'leri
│   ├── 📁 middleware/         # Middleware'ler
│   └── 📄 simple-server.js    # Ana server dosyası
├── 📁 src/                    # Frontend kaynak kodları
│   ├── 📁 components/         # React bileşenleri
│   ├── 📁 pages/             # Sayfa bileşenleri
│   ├── 📁 contexts/          # Context API
│   ├── 📁 services/          # API servisleri
│   └── 📁 types/             # TypeScript tipleri
├── 📁 docs/                  # Dokümantasyon
├── 📁 scripts/               # Geliştirme scriptleri
├── 📁 config/                # Konfigürasyon dosyaları
└── 📁 assets/                # Statik dosyalar
```

## 🎯 Özellikler

### 👤 Bireysel Panel
- Gönderi oluşturma ve yönetimi
- Teklif alma ve değerlendirme
- Takip ve bildirimler
- Profil yönetimi

### 🏢 Kurumsal Panel
- Toplu gönderi yönetimi
- Raporlama ve analitik
- Ekip yönetimi
- İndirim sistemi

### 🚛 Nakliyeci Panel
- Yük bulma ve teklif verme
- Araç optimizasyonu
- Cüzdan yönetimi
- Performans analizi

### 🚚 Taşıyıcı Panel
- İş kabul etme
- Kazanç takibi
- Profil yönetimi
- Mesajlaşma

## 🔧 Geliştirme

### Scripts
```bash
npm run dev:frontend    # Frontend development server
npm run dev:backend     # Backend development server
npm run build          # Production build
npm run preview        # Preview production build
```

### API Endpoints
- `GET /api/health` - Sistem durumu
- `POST /api/auth/demo-login` - Demo giriş
- `GET /api/profile` - Kullanıcı profili
- `POST /api/shipments` - Gönderi oluşturma
- `GET /api/shipments` - Gönderi listesi

## 📱 Mobil Uyumluluk
- Responsive tasarım
- Touch-friendly arayüz
- PWA desteği
- Offline çalışma

## 🛡️ Güvenlik
- JWT token authentication
- CORS koruması
- Input validation
- SQL injection koruması

## 📊 Test Durumu
- ✅ API Tests: 4/4 PASSED
- ✅ Frontend Tests: 1/1 PASSED
- ✅ Integration Tests: 4/4 PASSED
- ✅ Performance Tests: 1/1 PASSED
- **Başarı Oranı: 100%**

## 🚀 Deployment
- Frontend: Vite build
- Backend: Node.js server
- Database: SQLite
- Port: Frontend 5173, Backend 3001

## 📞 İletişim
- **Proje:** YolNet Kargo Pazar Yeri
- **Versiyon:** 1.0.0
- **Durum:** Production Ready

---
*Bu proje, modern web teknolojileri kullanılarak geliştirilmiştir.*







