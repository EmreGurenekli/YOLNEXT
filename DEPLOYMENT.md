# 🚀 YolNet Deployment Kılavuzu

## 📋 Genel Bakış

Bu kılavuz, YolNet platformunu production ortamına deploy etmek için gerekli tüm adımları içerir.

## 🛠️ Deployment Seçenekleri

### 1. Vercel (Önerilen - En Kolay)

**Avantajlar:**
- Otomatik SSL sertifikası
- CDN dahil
- Otomatik scaling
- GitHub entegrasyonu

**Adımlar:**
```bash
# 1. Vercel CLI yükle
npm install -g vercel

# 2. Login ol
vercel login

# 3. Deploy et
vercel --prod
```

### 2. Railway (Full Stack)

**Avantajlar:**
- Frontend + Backend birlikte
- PostgreSQL dahil
- Otomatik deployment
- Monitoring dahil

**Adımlar:**
```bash
# 1. Railway CLI yükle
npm install -g @railway/cli

# 2. Login ol
railway login

# 3. Deploy et
railway up
```

### 3. Docker (Kendi Sunucunuz)

**Avantajlar:**
- Tam kontrol
- Özelleştirilebilir
- Maliyet etkin

**Adımlar:**
```bash
# 1. Docker image oluştur
docker build -t yolnet-app .

# 2. Container çalıştır
docker run -p 3000:3000 yolnet-app
```

## 🗄️ Database Kurulumu

### PostgreSQL Kurulumu

**1. Yerel Kurulum:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
# PostgreSQL installer indir: https://www.postgresql.org/download/windows/
```

**2. Database Oluştur:**
```sql
-- PostgreSQL'e bağlan
psql -U postgres

-- Database oluştur
CREATE DATABASE yolnet_production;
CREATE USER yolnet_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE yolnet_production TO yolnet_user;
```

**3. Environment Variables:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yolnet_production
DB_USER=yolnet_user
DB_PASSWORD=secure_password
```

### Cloud Database Seçenekleri

**1. Supabase (Önerilen):**
- Ücretsiz tier: 500MB
- Otomatik backup
- Real-time features
- Dashboard dahil

**2. PlanetScale:**
- MySQL uyumlu
- Serverless
- Branching özelliği

**3. AWS RDS:**
- Tam kontrol
- Yüksek performans
- Enterprise özellikler

## 📊 Monitoring & Analytics

### 1. Google Analytics 4

**Kurulum:**
```html
<!-- index.html'e ekle -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 2. Sentry (Error Tracking)

**Kurulum:**
```bash
npm install @sentry/react @sentry/node
```

**Konfigürasyon:**
```javascript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

### 3. Uptime Monitoring

**Seçenekler:**
- UptimeRobot (Ücretsiz)
- Pingdom
- StatusCake
- AWS CloudWatch

## 🔒 SSL Sertifikası

### Otomatik SSL (Vercel/Railway)
- Otomatik olarak sağlanır
- Let's Encrypt kullanır
- Otomatik yenileme

### Manuel SSL (Kendi Sunucu)
```bash
# Let's Encrypt ile
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

## 📧 Email & SMS Servisleri

### SendGrid (Email)
1. SendGrid hesabı oluştur
2. API key al
3. Environment variable ekle:
```env
SENDGRID_API_KEY=your-api-key
```

### Twilio (SMS)
1. Twilio hesabı oluştur
2. Credentials al
3. Environment variables ekle:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
```

## 💳 Payment Integration

### Stripe
1. Stripe hesabı oluştur
2. API keys al
3. Webhook endpoint ayarla
4. Environment variables ekle:
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 🚀 Otomatik Deployment

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run deploy
```

## 📈 Performance Optimization

### 1. CDN Kullanımı
- Vercel: Otomatik CDN
- Cloudflare: Ücretsiz CDN
- AWS CloudFront: Enterprise CDN

### 2. Database Optimization
```sql
-- Index'ler oluştur
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_offers_carrier_id ON offers(carrier_id);
CREATE INDEX idx_users_email ON users(email);
```

### 3. Caching
```javascript
// Redis cache
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
```

## 🔧 Troubleshooting

### Yaygın Sorunlar

**1. Database Bağlantı Hatası:**
```bash
# Bağlantıyı test et
psql -h localhost -U yolnet_user -d yolnet_production
```

**2. CORS Hatası:**
```javascript
// CORS origin'i kontrol et
CORS_ORIGIN=https://yourdomain.com
```

**3. Memory Limit:**
```bash
# Node.js memory limit artır
node --max-old-space-size=4096 server.js
```

## 📞 Destek

- GitHub Issues: Bug raporları
- Email: support@yolnet.com
- Documentation: https://docs.yolnet.com

## 🎯 Sonraki Adımlar

1. ✅ Domain satın al
2. ✅ DNS ayarlarını yap
3. ✅ SSL sertifikasını aktifleştir
4. ✅ Database'i production'a taşı
5. ✅ Monitoring'i aktifleştir
6. ✅ Backup stratejisini uygula
7. ✅ Performance testleri yap
8. ✅ Security audit yap

---

**🎉 Tebrikler! YolNet platformunuz production'a hazır!**





