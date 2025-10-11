# YolNet Kargo Platform - Kurulum Talimatları

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Git

### 1. Projeyi İndirin
```bash
git clone <repository-url>
cd Yolnetgo
```

### 2. Bağımlılıkları Yükleyin
```bash
# Frontend bağımlılıkları
cd yolnet-kargo-ta-main
npm install

# Backend bağımlılıkları
cd ../backend
npm install
```

### 3. Veritabanını Başlatın
```bash
cd backend
node database/init.js
```

### 4. Server'ları Başlatın

**Terminal 1 - Backend:**
```bash
cd backend
node fixed-server.js
```

**Terminal 2 - Frontend:**
```bash
cd yolnet-kargo-ta-main
npm run dev
```

### 5. Erişim
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## 🔧 Geliştirme Ortamı

### Environment Variables
`.env` dosyası oluşturun:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key
DATABASE_URL=./yolnet.db
```

### Demo Hesaplar
- **Individual**: individual@demo.com / demo123
- **Corporate**: corporate@demo.com / demo123
- **Nakliyeci**: nakliyeci@demo.com / demo123
- **Taşıyıcı**: tasiyici@demo.com / demo123

## 📱 Production Deployment

### Docker ile Deployment
```bash
# Docker Compose ile
docker-compose up -d
```

### Manuel Production
```bash
# Backend
cd backend
NODE_ENV=production node fixed-server.js

# Frontend
cd yolnet-kargo-ta-main
npm run build
npm run preview
```

## 🧪 Test Çalıştırma

### Kapsamlı Testler
```bash
# Offline testler
node tests/offline-advanced-test.cjs

# Canlı testler
node tests/live-user-test.cjs

# Login testleri
node tests/fixed-login-test.cjs
```

### Performans Testleri
```bash
node tests/advanced-performance-test.cjs
```

## 🔍 Sorun Giderme

### Yaygın Sorunlar

**1. Port Zaten Kullanımda**
```bash
# Port'ları kontrol edin
netstat -an | findstr :5000
netstat -an | findstr :5173

# Process'leri sonlandırın
taskkill /f /im node.exe
```

**2. Veritabanı Bağlantı Hatası**
```bash
# Veritabanı dosyasını kontrol edin
ls backend/yolnet.db

# Yeniden oluşturun
rm backend/yolnet.db
node backend/database/init.js
```

**3. Bağımlılık Hataları**
```bash
# Cache temizle
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Log Kontrolü
```bash
# Backend logları
tail -f backend/logs/app.log

# Frontend logları
npm run dev -- --verbose
```

## 🚀 Production Checklist

- [ ] Environment variables ayarlandı
- [ ] Database backup alındı
- [ ] SSL sertifikası yapılandırıldı
- [ ] Rate limiting aktif
- [ ] Security headers eklendi
- [ ] Monitoring kuruldu
- [ ] Backup stratejisi belirlendi

## 📞 Destek

Sorunlar için:
- GitHub Issues
- Email: support@yolnet.com
- Dokümantasyon: README.md


