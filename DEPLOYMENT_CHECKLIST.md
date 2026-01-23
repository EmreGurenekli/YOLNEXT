# 🚀 YolNext Deployment Checklist

## Pre-Deployment Kontrolleri

### ✅ 1. Kod Kalitesi Kontrolleri
- [ ] Linter hataları düzeltildi: `npm run lint`
- [ ] TypeScript hataları yok: `npm run build:frontend`
- [ ] Backend build başarılı: `cd backend && npm run build`
- [ ] Console.log'lar production için kaldırıldı (vite.config.ts'de drop_console: true)

### ✅ 2. Environment Variables Kontrolü

#### Backend (.env veya Render.com Environment Variables)
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000` (Render.com için)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Güçlü secret (min 32 karakter)
- [ ] `FRONTEND_ORIGIN` - Netlify frontend URL'i
- [ ] `DB_POOL_MAX=20`
- [ ] `DB_IDLE_TIMEOUT=30000`
- [ ] `DB_CONNECTION_TIMEOUT=2000`

#### Frontend (Netlify Environment Variables)
- [ ] `VITE_API_URL` - Render.com backend URL'i
- [ ] Build command: `npm run build:frontend`
- [ ] Publish directory: `dist`

### ✅ 3. Database Migration Kontrolü
- [ ] Tüm migration'lar test edildi
- [ ] Production database'e migration script hazır
- [ ] Backup alındı (production için)

### ✅ 4. Security Kontrolleri
- [ ] JWT_SECRET güçlü ve unique
- [ ] CORS ayarları doğru (sadece frontend origin)
- [ ] Rate limiting aktif
- [ ] Security headers aktif (Helmet)
- [ ] Environment variables commit edilmedi (.gitignore kontrolü)

### ✅ 5. Build ve Test Kontrolleri
- [ ] Frontend build başarılı: `npm run build:frontend`
- [ ] Backend başlatma test edildi: `cd backend && node server-modular.js`
- [ ] Health check endpoint çalışıyor: `/api/health/live`
- [ ] Database connection test edildi

---

## 📦 Deployment Adımları

### Frontend (Netlify)

1. **Netlify Dashboard'a Git**
   - https://app.netlify.com

2. **Site Ayarları**
   - Build command: `npm run build:frontend`
   - Publish directory: `dist`
   - Node version: `18`

3. **Environment Variables Ekle**
   ```
   VITE_API_URL=https://yolnext-backend.onrender.com
   ```

4. **Deploy**
   - GitHub'a push yap veya manuel deploy
   - Netlify otomatik deploy edecek

5. **Domain Ayarları**
   - Custom domain ekle (opsiyonel)
   - SSL otomatik aktif olacak

### Backend (Render.com)

1. **Render.com Dashboard'a Git**
   - https://dashboard.render.com

2. **New PostgreSQL Database Oluştur**
   - Name: `yolnext-database`
   - PostgreSQL Version: 15
   - Plan: Starter (veya production için Standard)

3. **New Web Service Oluştur**
   - Connect GitHub repository
   - Name: `yolnext-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server-modular.js`
   - Plan: Starter (veya production için Standard)

4. **Environment Variables Ekle**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<Render PostgreSQL connection string>
   JWT_SECRET=<Güçlü secret key>
   FRONTEND_ORIGIN=https://your-netlify-app.netlify.app
   DB_POOL_MAX=20
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=2000
   ```

5. **Health Check Ayarla**
   - Health Check Path: `/api/health/live`

6. **Auto-Deploy Aktif Et**
   - GitHub push'ta otomatik deploy

7. **Database Migration Çalıştır**
   ```bash
   # Render.com shell'den veya local'den:
   cd backend
   node database/setup-database.js
   # veya
   node migrations/migration-runner.js
   ```

---

## 🔍 Post-Deployment Kontrolleri

### Frontend
- [ ] Site açılıyor: https://your-app.netlify.app
- [ ] API bağlantısı çalışıyor
- [ ] Login/Register çalışıyor
- [ ] Tüm sayfalar yükleniyor
- [ ] Console'da hata yok

### Backend
- [ ] Health check çalışıyor: https://your-backend.onrender.com/api/health/live
- [ ] API endpoint'leri çalışıyor
- [ ] Database bağlantısı aktif
- [ ] Logs temiz (kritik hata yok)
- [ ] Response time makul (< 2 saniye)

### Database
- [ ] Migration'lar uygulandı
- [ ] Tablolar oluşturuldu
- [ ] Index'ler oluşturuldu
- [ ] Connection pool çalışıyor

---

## 🐛 Troubleshooting

### Frontend Build Hatası
```bash
# Local'de test et:
npm run build:frontend

# Hataları kontrol et:
npm run lint
```

### Backend Başlamıyor
```bash
# Local'de test et:
cd backend
node server-modular.js

# Environment variables kontrol et:
cat backend/.env
```

### Database Connection Hatası
- DATABASE_URL doğru mu kontrol et
- PostgreSQL servisi çalışıyor mu kontrol et
- Firewall ayarları kontrol et (Render.com için gerekli değil)

### CORS Hatası
- FRONTEND_ORIGIN doğru mu kontrol et
- Netlify URL'i tam olarak eşleşiyor mu kontrol et

---

## 📝 Notlar

- **Free Tier Limits:**
  - Render.com: 750 saat/ay (yaklaşık 31 gün)
  - Netlify: 100GB bandwidth/ay
  - Production için paid plan önerilir

- **Performance:**
  - Render.com free tier'da cold start olabilir (ilk istek yavaş)
  - Database connection pool ayarları önemli
  - Frontend caching ayarları netlify.toml'da

- **Monitoring:**
  - Render.com dashboard'dan logs takip edilebilir
  - Netlify dashboard'dan build logs takip edilebilir
  - Sentry entegrasyonu için SENTRY_DSN ekle

---

**Son Güncelleme:** 2025-01-XX

