# Deployment Rehberi

## Netlify Frontend Deployment

### 1. Environment Variables Ekleme

Netlify dashboard'da şu environment variable'ları ekleyin:

1. **Netlify Dashboard'a gidin:** https://app.netlify.com
2. **Site Settings > Environment variables** bölümüne gidin
3. Şu değişkenleri ekleyin:

```
VITE_API_URL=https://yolnext-backend.onrender.com
VITE_COMPANY_NAME=YolNext Lojistik Hizmetleri A.S.
VITE_COMPANY_ADDRESS=Maslak Mahallesi Buyukdere Caddesi No:255 Noramin Is Merkezi Kat:8 Sariyer/Istanbul
VITE_COMPANY_PHONE=+90 212 456 78 90
VITE_SUPPORT_EMAIL=destek@yolnext.com.tr
VITE_KVKK_EMAIL=kvkk@yolnext.com.tr
VITE_LEGAL_DOC_VERSION=v1.0.0
```

**Not:** `VITE_API_URL` değerini Render.com'dan aldığınız backend URL'i ile değiştirin.

### 2. Deployment Kontrolü

- Netlify otomatik olarak GitHub push'larında deploy eder
- Deployment loglarını kontrol edin: **Deploys** sekmesi
- Site URL'iniz: Netlify dashboard'da gösterilir

---

## Render.com Backend Deployment

### 1. Backend URL'ini Bulma

1. **Render Dashboard'a gidin:** https://dashboard.render.com
2. **Services** bölümünden `yolnext-backend` servisini açın
3. **URL** bölümünde backend URL'inizi göreceksiniz (örnek: `https://yolnext-backend.onrender.com`)

### 2. Backend'i Test Etme

Backend bir API servisi olduğu için tarayıcıda direkt açılmaz. Şu şekilde test edebilirsiniz:

#### A) Health Check Endpoint'i Test Etme

Tarayıcıda şu URL'i açın:
```
https://yolnext-backend.onrender.com/api/health/live
```

Başarılı ise şu yanıtı görmelisiniz:
```json
{"status":"ok","timestamp":"..."}
```

#### B) Frontend'e Bağlama

1. Render.com'dan backend URL'inizi kopyalayın
2. Netlify'da `VITE_API_URL` environment variable'ını bu URL ile güncelleyin
3. Netlify'da yeni bir deploy tetikleyin (Settings > Build & deploy > Trigger deploy)

### 3. Backend Loglarını Kontrol Etme

- Render dashboard'da **Logs** sekmesinden backend loglarını görebilirsiniz
- Hata varsa buradan görebilirsiniz

---

## Tam Test Senaryosu

1. **Backend Health Check:**
   ```
   https://yolnext-backend.onrender.com/api/health/live
   ```

2. **Frontend Test:**
   - Netlify site URL'inizi açın
   - Login sayfası açılmalı
   - API istekleri backend'e gitmeli

3. **API Bağlantısı Test:**
   - Browser Developer Tools > Network sekmesini açın
   - Frontend'de bir işlem yapın (login, gönderi oluşturma vb.)
   - API isteklerinin backend URL'ine gittiğini kontrol edin

---

## Sorun Giderme

### Netlify'da "Missing required env" Hatası

- Environment variable'ları Netlify dashboard'dan eklediğinizden emin olun
- Deploy'u yeniden tetikleyin

### Backend'e Bağlanamıyor

- Backend URL'inin doğru olduğundan emin olun
- CORS ayarlarını kontrol edin (Render.com'da `FRONTEND_ORIGIN` doğru mu?)
- Backend loglarını kontrol edin

### Database Bağlantı Hatası

- Render.com'da database servisinin çalıştığından emin olun
- `DATABASE_URL` environment variable'ının doğru olduğundan emin olun

