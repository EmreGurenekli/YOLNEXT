# 🚀 YolNet Deployment Kılavuzu

## 📋 Genel Bilgiler
Bu kılavuz, YolNet Kargo Pazar Yeri platformunun production ortamına deploy edilmesi için gerekli adımları içerir.

## 🏗️ Sistem Gereksinimleri

### Minimum Gereksinimler
- **CPU:** 2 core
- **RAM:** 4GB
- **Disk:** 20GB SSD
- **OS:** Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

### Önerilen Gereksinimler
- **CPU:** 4 core
- **RAM:** 8GB
- **Disk:** 50GB SSD
- **OS:** Ubuntu 22.04 LTS

## 🔧 Kurulum Adımları

### 1. Sistem Hazırlığı
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm nginx

# CentOS/RHEL
sudo yum update
sudo yum install -y nodejs npm nginx
```

### 2. Proje Kurulumu
```bash
# Projeyi klonlayın
git clone <repository-url>
cd yolnet-kargo

# Bağımlılıkları yükleyin
npm install

# Production build
npm run build
```

### 3. Backend Konfigürasyonu
```bash
# Environment variables
cp env.example .env

# .env dosyasını düzenleyin
nano .env
```

**Örnek .env dosyası:**
```env
NODE_ENV=production
PORT=3001
DB_PATH=./yolnet-kargo.db
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://yourdomain.com
```

### 4. Frontend Konfigürasyonu
```bash
# Vite config düzenleme
nano vite.config.ts
```

**Production vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})
```

## 🌐 Nginx Konfigürasyonu

### 1. Nginx Kurulumu
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Site Konfigürasyonu
```bash
sudo nano /etc/nginx/sites-available/yolnet-kargo
```

**Nginx konfigürasyonu:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend
    location / {
        root /var/www/yolnet-kargo/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /assets {
        root /var/www/yolnet-kargo/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Site Aktifleştirme
```bash
sudo ln -s /etc/nginx/sites-available/yolnet-kargo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL Sertifikası

### Let's Encrypt ile SSL
```bash
# Certbot kurulumu
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Otomatik yenileme
sudo crontab -e
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 Docker Deployment

### 1. Dockerfile Oluştur
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 3001
CMD ["node", "simple-server.js"]
```

### 2. Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - ./data:/app/data
  
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
```

### 3. Docker Build ve Run
```bash
docker-compose up -d
```

## 🔄 Process Management

### PM2 ile Process Yönetimi
```bash
# PM2 kurulumu
npm install -g pm2

# Backend'i PM2 ile başlat
pm2 start backend/simple-server.js --name "yolnet-backend"

# Frontend'i PM2 ile başlat
pm2 start "npm run preview" --name "yolnet-frontend"

# PM2 konfigürasyonu
pm2 startup
pm2 save
```

## 📊 Monitoring

### 1. Log Yönetimi
```bash
# PM2 logları
pm2 logs

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Sistem Monitoring
```bash
# Sistem durumu
htop
df -h
free -h

# Port kontrolü
netstat -tlnp | grep :3001
netstat -tlnp | grep :80
```

## 🔧 Backup ve Restore

### 1. Veritabanı Backup
```bash
# SQLite backup
cp yolnet-kargo.db backup/yolnet-kargo-$(date +%Y%m%d).db

# Otomatik backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/yolnet-kargo/backend/yolnet-kargo.db /backup/yolnet-kargo-$DATE.db
find /backup -name "yolnet-kargo-*.db" -mtime +7 -delete
```

### 2. Dosya Backup
```bash
# Tüm proje backup
tar -czf yolnet-kargo-backup-$(date +%Y%m%d).tar.gz /var/www/yolnet-kargo/
```

## 🚨 Troubleshooting

### Yaygın Sorunlar

#### 1. Port Çakışması
```bash
# Port kullanımını kontrol et
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :80

# Process'i sonlandır
sudo kill -9 <PID>
```

#### 2. Nginx Hatası
```bash
# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

#### 3. Node.js Hatası
```bash
# PM2 loglarını kontrol et
pm2 logs yolnet-backend

# Process'i yeniden başlat
pm2 restart yolnet-backend
```

## 📈 Performance Optimization

### 1. Nginx Optimizasyonu
```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Node.js Optimizasyonu
```javascript
// Cluster mode
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    // Server code
}
```

## 🔐 Güvenlik

### 1. Firewall Konfigürasyonu
```bash
# UFW ile firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. SSL/TLS
- Let's Encrypt sertifikası
- HTTP'den HTTPS'e yönlendirme
- HSTS header'ları

### 3. Güvenlik Headers
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 📞 Destek

### Deployment Sorunları
- Log dosyalarını kontrol edin
- Sistem kaynaklarını kontrol edin
- Network bağlantısını kontrol edin

### Performans Sorunları
- Database query'lerini optimize edin
- Cache stratejilerini uygulayın
- CDN kullanın

---

*Bu kılavuz, YolNet platformunun production ortamına deploy edilmesi için hazırlanmıştır.*







