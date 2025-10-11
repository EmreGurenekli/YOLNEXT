# YolNet Kargo Platformu - Tam Özellikli Marketplace

## 🚀 Proje Özeti

YolNet, Türkiye'nin en kapsamlı kargo ve lojistik marketplace platformudur. Bireysel kullanıcılardan büyük şirketlere, nakliyecilerden taşıyıcılara kadar tüm lojistik ekosistemini bir araya getiren modern bir platform.

## ✨ Özellikler

### 🏢 **4 Farklı Kullanıcı Paneli**
- **Bireysel Panel**: Kişisel gönderiler için
- **Kurumsal Panel**: Şirket gönderileri ve ekip yönetimi
- **Nakliyeci Panel**: Profesyonel taşıyıcılar için
- **Taşıyıcı Panel**: Bireysel araç sahipleri için

### 💳 **Gelişmiş Ödeme Sistemi**
- Kredi/Banka kartı ödemeleri
- YolNet cüzdan sistemi
- Banka havalesi entegrasyonu
- Güvenli ödeme işlemleri
- Komisyon yönetimi

### 🔒 **Güvenlik Özellikleri**
- JWT tabanlı kimlik doğrulama
- İki faktörlü kimlik doğrulama (2FA)
- Şifre güçlülük kontrolü
- Güvenlik logları
- Şüpheli aktivite raporlama

### 📱 **Mobil Optimizasyon**
- Responsive tasarım
- Mobil-first yaklaşım
- Sürücü odaklı arayüz
- Touch-friendly kontroller
- Offline destek

### ⚡ **Gerçek Zamanlı Özellikler**
- WebSocket bağlantısı
- Anlık mesajlaşma
- Push bildirimleri
- Canlı güncellemeler
- Gerçek zamanlı takip

### 📊 **Analitik ve Raporlama**
- Detaylı analitik dashboard
- Maliyet analizi
- Performans raporları
- Departman bazlı raporlama
- Workflow yönetimi

### 🚛 **Lojistik Özellikleri**
- Akıllı eşleştirme sistemi
- Filo yönetimi
- Araç optimizasyonu
- Yük takibi
- Rota planlama

## 🛠️ Teknoloji Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type safety
- **Vite** - Hızlı build tool
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animasyonlar
- **React Router DOM** - Routing
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **Socket.IO** - Real-time features
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Testing
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **Testing Library** - Component testing

### DevOps
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **PM2** - Process management

## 📁 Proje Yapısı

```
yolnet-kargo-platform/
├── src/
│   ├── components/          # Reusable components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── services/           # API services
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   └── tests/              # Test files
├── backend/
│   ├── routes/             # API routes
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   └── database/           # Database files
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Git

### Kurulum
```bash
# Repository'yi klonlayın
git clone https://github.com/your-username/yolnet-kargo-platform.git
cd yolnet-kargo-platform

# Bağımlılıkları yükleyin
npm run install:all

# Veritabanını başlatın
cd backend
node database/init.js

# Uygulamayı başlatın
npm run dev:all
```

### Geliştirme
```bash
# Frontend'i başlat
npm run dev:frontend

# Backend'i başlat
npm run dev:backend

# Testleri çalıştır
npm run test

# E2E testleri çalıştır
npm run test:e2e
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Kullanıcı kaydı
- `GET /api/auth/me` - Kullanıcı bilgileri
- `POST /api/auth/logout` - Çıkış

### Shipments
- `GET /api/shipments` - Gönderi listesi
- `POST /api/shipments` - Yeni gönderi
- `GET /api/shipments/:id` - Gönderi detayı
- `PUT /api/shipments/:id` - Gönderi güncelleme
- `DELETE /api/shipments/:id` - Gönderi silme

### Messages
- `GET /api/messages` - Mesaj listesi
- `POST /api/messages` - Mesaj gönderme

### Wallet
- `GET /api/wallet` - Cüzdan bilgileri
- `GET /api/wallet/transactions` - İşlem geçmişi
- `POST /api/wallet/withdraw` - Para çekme

### Analytics
- `GET /api/analytics` - Analitik veriler

## 🧪 Test

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 📱 Mobil Uygulama

Platform tamamen mobil uyumludur ve PWA (Progressive Web App) özelliklerine sahiptir:

- Offline çalışma
- Push bildirimleri
- App-like deneyim
- Hızlı yükleme

## 🔐 Güvenlik

- Tüm API istekleri JWT ile korunur
- Şifreler bcrypt ile hash'lenir
- XSS ve CSRF koruması
- Rate limiting
- Input validation
- SQL injection koruması

## 📈 Performans

- Lazy loading
- Code splitting
- Image optimization
- Caching strategies
- Database indexing
- CDN integration

## 🌐 Deployment

### Production Build
```bash
npm run build:all
```

### Docker Deployment
```bash
docker-compose up -d
```

### Environment Variables
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
SOCKET_URL=your-socket-url
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Website**: https://yolnet.com
- **Email**: info@yolnet.com
- **Phone**: +90 212 555 0123

## 🙏 Teşekkürler

- React ekibine
- Tailwind CSS ekibine
- Tüm açık kaynak katkıda bulunanlara

---

**YolNet** - Türkiye'nin en güvenilir lojistik marketplace'i 🚛✨



