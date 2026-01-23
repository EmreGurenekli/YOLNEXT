# 🚀 YolNext Deployment Rehberi - Adım Adım

## 📋 ÖN HAZIRLIK

### 1. GitHub Repository Oluşturma

1. **GitHub'a giriş yapın:** https://github.com/login
2. **Yeni repository oluşturun:** https://github.com/new
3. **Repository bilgileri:**
   - Repository name: `YOLNEXT`
   - Description: `YolNext Kargo Platformu - Full-Stack Lojistik Pazaryeri`
   - Public seçin ✅
   - **ÖNEMLİ:** "Initialize this repository with" seçeneklerini **BOŞ BIRAKIN** (README, .gitignore, license eklemeyin)
4. **"Create repository" butonuna tıklayın**
5. **Repository URL'ini kopyalayın** (örn: `https://github.com/kullaniciadi/YOLNEXT.git`)

### 2. GitHub URL'ini Bana Verin

Repository URL'ini paylaştığınızda, ben otomatik olarak:
- ✅ Remote URL'i güncelleyeceğim
- ✅ GitHub'a push yapacağım
- ✅ Deployment script'lerini hazırlayacağım

---

## 🌐 NETLIFY DEPLOYMENT (Frontend)

### Adım 1: Netlify'a Giriş
1. **Netlify'a gidin:** https://app.netlify.com/
2. **"Sign up" veya "Log in"** butonuna tıklayın
3. **"Add new site"** → **"Import an existing project"** butonuna tıklayın

### Adım 2: GitHub Bağlantısı
1. **"GitHub"** seçeneğine tıklayın
2. İlk kez ise GitHub hesabınızı bağlayın (authorize Netlify)
3. **Repository listesinden "YOLNEXT"** seçin
4. **"Import"** butonuna tıklayın

### Adım 3: Build Ayarları
Netlify otomatik olarak `netlify.toml` dosyasını okuyacak, ama kontrol edin:

- **Build command:** `npm run build:frontend` ✅
- **Publish directory:** `dist` ✅
- **Branch to deploy:** `main` ✅

### Adım 4: Environment Variables
1. **"Site settings"** → **"Environment variables"** → **"Add variable"**
2. Şu değişkeni ekleyin:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://yolnext-backend.onrender.com` (Render.com backend URL'i - sonra güncellenecek)
3. **"Save"** butonuna tıklayın

### Adım 5: Deploy
1. **"Deploy site"** butonuna tıklayın
2. Build başlayacak (2-5 dakika sürebilir)
3. Deploy tamamlandığında **site URL'ini kopyalayın** (örn: `https://yolnext.netlify.app`)

---

## 🔧 RENDER.COM DEPLOYMENT (Backend + Database)

### Adım 1: Render.com'a Giriş
1. **Render.com'a gidin:** https://dashboard.render.com/
2. **"Get started for free"** veya **"Log in"** butonuna tıklayın
3. **GitHub hesabınızla giriş yapın**

### Adım 2: PostgreSQL Database Oluşturma
1. **"New +"** butonuna tıklayın
2. **"PostgreSQL"** seçeneğine tıklayın
3. **Database ayarları:**
   - **Name:** `yolnext-database`
   - **Database:** `yolnext`
   - **User:** `yolnext_user`
   - **Region:** En yakın bölgeyi seçin (örn: Frankfurt)
   - **PostgreSQL Version:** `15`
   - **Plan:** `Free` (starter)
4. **"Create Database"** butonuna tıklayın
5. Database oluşturulduktan sonra **"Internal Database URL"** değerini kopyalayın

### Adım 3: Backend Web Service Oluşturma
1. **"New +"** butonuna tıklayın
2. **"Web Service"** seçeneğine tıklayın
3. **"Connect GitHub"** butonuna tıklayın (ilk kez ise GitHub'ı authorize edin)
4. **Repository listesinden "YOLNEXT"** seçin
5. **"Connect"** butonuna tıklayın

### Adım 4: Backend Ayarları
Render otomatik olarak `render.yaml` dosyasını okuyacak, ama kontrol edin:

- **Name:** `yolnext-backend`
- **Region:** Database ile aynı bölgeyi seçin
- **Branch:** `main`
- **Root Directory:** (boş bırakın)
- **Runtime:** `Node`
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && node server-modular.js`
- **Plan:** `Free` (starter)

### Adım 5: Environment Variables
1. **"Environment"** sekmesine gidin
2. Şu değişkenleri ekleyin:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | (Database'in "Internal Database URL" değerini seçin - dropdown'dan) |
   | `JWT_SECRET` | (Render otomatik generate edecek veya manuel ekleyin) |
   | `FRONTEND_ORIGIN` | `https://yolnext.netlify.app` (Netlify URL'iniz) |
   | `DB_POOL_MAX` | `20` |
   | `DB_IDLE_TIMEOUT` | `30000` |
   | `DB_CONNECTION_TIMEOUT` | `2000` |

3. **"Save Changes"** butonuna tıklayın

### Adım 6: Health Check
1. **"Settings"** sekmesine gidin
2. **"Health Check Path"** alanına: `/api/health/live` yazın
3. **"Save Changes"** butonuna tıklayın

### Adım 7: Deploy
1. **"Manual Deploy"** → **"Deploy latest commit"** butonuna tıklayın
2. Build başlayacak (5-10 dakika sürebilir)
3. Deploy tamamlandığında **service URL'ini kopyalayın** (örn: `https://yolnext-backend.onrender.com`)

---

## 🔄 URL'LERİ GÜNCELLEME

### Netlify'da Backend URL'ini Güncelleme
1. Netlify dashboard'a gidin
2. **Site settings** → **Environment variables**
3. `VITE_API_URL` değerini Render.com backend URL'i ile güncelleyin
4. **"Save"** → **"Trigger deploy"** → **"Deploy site"**

### Render.com'da Frontend URL'ini Güncelleme
1. Render.com dashboard'a gidin
2. Backend service'e tıklayın
3. **"Environment"** sekmesine gidin
4. `FRONTEND_ORIGIN` değerini Netlify URL'i ile güncelleyin
5. **"Save Changes"** → Otomatik redeploy başlayacak

---

## ✅ TEST

### Frontend Test
1. Netlify URL'inize gidin (örn: `https://yolnext.netlify.app`)
2. Sayfa yüklenmeli ✅
3. Login sayfası görünmeli ✅

### Backend Test
1. Backend health check: `https://yolnext-backend.onrender.com/api/health/live`
2. Status 200 ve `{"status":"ok"}` dönmeli ✅

### Entegrasyon Test
1. Frontend'ten login deneyin
2. API çağrıları çalışmalı ✅

---

## 📞 YARDIM

Herhangi bir adımda takılırsanız, hangi adımda olduğunuzu ve hata mesajını paylaşın!

