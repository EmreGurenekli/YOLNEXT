# 🚀 Deployment Guide

YolNext platformu için production deployment rehberi.

---

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri
- **Node.js:** v18+ veya v20+
- **PostgreSQL:** v14+
- **RAM:** Minimum 2GB (4GB önerilir)
- **Disk:** Minimum 20GB (50GB önerilir)
- **CPU:** 2+ core

### Gerekli Servisler
- PostgreSQL database
- SMTP server (email gönderimi için)
- Twilio account (SMS için, opsiyonel)
- Iyzico account (payment için, opsiyonel)
- Domain ve SSL certificate

---

## 🔧 Environment Setup

### 1. Environment Variables

`.env` dosyasını production değerleriyle doldurun:

```bash
# Production Environment
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://www.yolnext.com
FRONTEND_ORIGIN=https://www.yolnext.com

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=yolnext_prod
DB_USER=yolnext_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yolnext.com

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Payment (Optional)
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
IYZICO_MODE=production

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=production
```

### 2. Database Setup

```bash
# PostgreSQL database oluştur
createdb yolnext_prod

# Migration çalıştır (backend otomatik tablo oluşturur)
cd backend
node postgres-backend.js
```

---

## 🏗️ Build Process

### Frontend Build

```bash
# Dependencies install
npm install

# Build frontend
npm run build:frontend

# Output: dist/ directory
```

### Backend Setup

```bash
cd backend
npm install

# Backend production mode'da çalışır
NODE_ENV=production node postgres-backend.js
```

---

## 🌐 Deployment Options

### Option 1: PM2 (Önerilen)

```bash
# PM2 install
npm install -g pm2

# Start backend
cd backend
pm2 start postgres-backend.js --name yolnext-backend

# Start frontend (if serving with Node)
pm2 start npm --name yolnext-frontend -- run preview

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 2: Docker

```dockerfile
# Dockerfile example
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "backend/postgres-backend.js"]
```

### Option 3: Nginx + Node.js

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name www.yolnext.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.yolnext.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    location / {
        root /var/www/yolnext/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔒 Security Checklist

- [ ] HTTPS aktif
- [ ] SSL certificate geçerli
- [ ] Environment variables güvenli
- [ ] Database password güçlü
- [ ] JWT secret güçlü
- [ ] Security headers aktif
- [ ] Rate limiting aktif
- [ ] Firewall kuralları ayarlı
- [ ] Backup stratejisi aktif

---

## 📊 Monitoring Setup

### 1. Health Checks

```bash
# Backend health check
curl https://www.yolnext.com/api/health

# Response: {"status":"ok","database":"connected"}
```

### 2. Logging

```bash
# PM2 logs
pm2 logs yolnext-backend

# Log rotation
pm2 install pm2-logrotate
```

### 3. Monitoring Tools

- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry
- **Performance:** New Relic, Datadog
- **Analytics:** Google Analytics

---

## 🔄 Update Process

### 1. Backup Database

```bash
node backend/scripts/backup-database.js
```

### 2. Pull Latest Code

```bash
git pull origin main
```

### 3. Install Dependencies

```bash
npm install
cd backend && npm install
```

### 4. Build Frontend

```bash
npm run build:frontend
```

### 5. Restart Services

```bash
# PM2
pm2 restart yolnext-backend
pm2 restart yolnext-frontend

# Or systemd
systemctl restart yolnext
```

### 6. Verify

```bash
# Health check
curl https://www.yolnext.com/api/health

# Check logs
pm2 logs yolnext-backend --lines 50
```

---

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U yolnext_user -d yolnext_prod
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Build Errors
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules dist
npm install
npm run build
```

---

## 📝 Post-Deployment

### 1. Verify Functionality
- [ ] Login works
- [ ] Registration works
- [ ] Shipment creation works
- [ ] API calls work
- [ ] WebSocket connections work

### 2. Performance Check
- [ ] Page load times < 2s
- [ ] API response times < 500ms
- [ ] Database queries optimized

### 3. Security Check
- [ ] HTTPS redirects work
- [ ] Security headers present
- [ ] Rate limiting works
- [ ] Error messages don't leak info

---

## 🔗 Useful Commands

```bash
# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Monitor
pm2 monit

# Database backup
node backend/scripts/backup-database.js

# Health check
curl https://www.yolnext.com/api/health
```

---

**Son Güncelleme:** 2025-01-11

