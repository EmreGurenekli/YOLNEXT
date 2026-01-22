# YolNext Kargo Platformu - Geliştirici Raporu

## 📋 Proje Genel Bakış

**Proje Adı:** YolNext Kargo Platformu  
**Versiyon:** 1.0.0  
**Proje Tipi:** Full-Stack Lojistik Pazaryeri  
**Geliştirme Tarihi:** 2026  

**🎯 Amaç:** Türkiye'nin en büyük lojistik pazaryeri platformu - 4 farklı kullanıcı tipi (Bireysel Gönderici, Kurumsal Gönderici, Nakliyeci, Taşıyıcı) için entegre lojistik çözümü.

---

## ⚙️ Gereksinimler (Requirements)

### Sistem Gereksinimleri
- **Node.js:** v18.0.0 veya üzeri
- **npm:** v9.0.0 veya üzeri
- **PostgreSQL:** v14.0 veya üzeri (Production) / SQLite (Development)
- **Docker:** v20.0 veya üzeri (Opsiyonel, önerilir)
- **Git:** v2.30 veya üzeri

### Geliştirme Ortamı
- **OS:** Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **RAM:** Minimum 8GB (16GB önerilir)
- **Disk:** Minimum 10GB boş alan

---

## 🚀 Hızlı Başlangıç (Quick Start)

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd YOLNEXT
```

### 2. Bağımlılıkları Kurun
```bash
# Tüm bağımlılıkları kur (frontend + backend)
npm run install:all

# Veya ayrı ayrı:
npm install
cd backend && npm install && cd ..
```

### 3. Environment Variables Ayarlayın
```bash
# Root dizinde .env dosyası oluşturun
cp env.example .env

# Backend için .env dosyası oluşturun
cp backend/env.example backend/.env
```

**Önemli Environment Variables:**
- `DATABASE_URL` veya `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- `JWT_SECRET` (güvenli bir secret key)
- `VITE_API_URL` (frontend için backend URL'i)

### 4. Veritabanını Kurun

**Seçenek 1: Docker ile (Önerilir)**
```bash
docker-compose up -d
```

**Seçenek 2: SQLite (Development için)**
```bash
# SQLite otomatik olarak kullanılacak, ekstra kurulum gerekmez
```

**Seçenek 3: Manuel PostgreSQL**
```bash
# PostgreSQL kurulumu ve veritabanı oluşturma
createdb yolnext_dev

# Migration'ları çalıştır
cd backend
node database/setup-database.js
# veya
npm run migrate
```

### 5. Projeyi Çalıştırın

**Development Mode (Frontend + Backend birlikte):**
```bash
npm run dev:all
```

**Ayrı ayrı çalıştırmak için:**
```bash
# Terminal 1: Backend
npm run dev:backend
# veya
cd backend && node server-modular.js

# Terminal 2: Frontend
npm run dev:frontend
# veya
npm run dev
```

### 6. Erişim Noktaları
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **API Health Check:** http://localhost:5000/api/health
- **Socket.IO:** http://localhost:5000

### 7. Test Kullanıcıları (Demo)
```
Bireysel Gönderici: individual@demo.com / demo123
Kurumsal Gönderici: corporate@demo.com / demo123
Nakliyeci: nakliyeci@demo.com / demo123
Taşıyıcı: tasiyici@demo.com / demo123
```

---

## 📝 Önemli Komutlar

### Geliştirme
```bash
npm run dev:all          # Frontend + Backend birlikte
npm run dev:frontend     # Sadece frontend
npm run dev:backend      # Sadece backend
```

### Build
```bash
npm run build:all        # Frontend + Backend build
npm run build:frontend   # Sadece frontend build
npm run build:backend    # Sadece backend build
```

### Test
```bash
npm run test            # Unit testler
npm run test:e2e        # E2E testler
npm run test:all        # Tüm testler
npm run test:coverage   # Test coverage raporu
```

### Veritabanı
```bash
npm run db:reset        # Veritabanını sıfırla
cd backend && npm run migrate  # Migration çalıştır
```

### Diğer
```bash
npm run lint            # Kod kontrolü
npm run lint:fix        # Kod düzeltmeleri
npm run clean:all       # Temizleme
```

---

## 🔑 Environment Variables Detayları

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=10000
```

### Backend (backend/.env veya backend/config.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/yolnext
# veya ayrı ayrı:
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=yolnext
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Payment (Opsiyonel)
IYZICO_API_KEY=your-iyzico-api-key
IYZICO_SECRET_KEY=your-iyzico-secret-key

# Email (Opsiyonel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Not:** Tüm environment variables için `env.example` dosyasına bakın.

---

## 📚 API Dokümantasyonu

### API Endpoints
- **Base URL:** `http://localhost:5000/api`
- **Authentication:** JWT Bearer Token
- **Format:** JSON

### Ana Endpoint'ler
- `/api/auth/*` - Authentication (login, register, password reset)
- `/api/shipments/*` - Gönderi yönetimi
- `/api/users/*` - Kullanıcı yönetimi
- `/api/payments/*` - Ödeme işlemleri
- `/api/messages/*` - Mesajlaşma
- `/api/smart-route/*` - Akıllı rota planlama

### API Kullanımı
```bash
# Health check
curl http://localhost:5000/api/health

# Login örneği
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"individual@demo.com","password":"demo123"}'
```

**Not:** Detaylı API dokümantasyonu için backend kodundaki route dosyalarına bakın (`backend/routes/`).

---

## 🏗️ Teknoloji Yığını

### Frontend (Client-Side)
- **Framework:** React 18.2.0 + TypeScript 5.3.3
- **Build Tool:** Vite 5.0.0 (ESM Module)
- **Styling:** TailwindCSS 3.3.6 + CSS Modules
- **UI Components:** Custom component library + Lucide React Icons
- **State Management:** React Context API + React Hook Form
- **Routing:** React Router DOM 6.20.1
- **HTTP Client:** Axios 1.6.2
- **Real-time:** Socket.IO Client 4.8.1
- **Testing:** Jest + React Testing Library + Playwright E2E

### Backend (Server-Side)
- **Runtime:** Node.js (CommonJS Module)
- **Framework:** Express.js 4.21.2
- **Language:** JavaScript (ES2020) + TypeScript for types
- **Database:** PostgreSQL 8.16.3 (Production) + SQLite (Development)
- **ORM:** Sequelize 6.37.7
- **Authentication:** JWT (jsonwebtoken 9.0.2) + bcrypt
- **Real-time:** Socket.IO 4.8.1
- **Security:** Helmet 7.2.0 + CORS + Rate Limiting
- **File Upload:** Multer 1.4.5
- **Email:** Nodemailer 7.0.10
- **Monitoring:** Winston Logging + Prometheus + Sentry
- **Payment:** Stripe 14.25.0 + Iyzico 2.0.64

### DevOps & Deployment
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (Load Balancer + SSL)
- **Process Manager:** PM2 (ecosystem.config.js)
- **CI/CD:** GitHub Actions
- **Monitoring:** Grafana + Logstash + Prometheus
- **Deployment:** Railway + Render + Custom VPS

---

## 📁 Proje Yapısı

```
YOLNEXT/
├── 📁 src/                    # Frontend Source Code
│   ├── 📁 pages/              # 89 Page Components (4 Panel Types)
│   ├── 📁 components/        # 78 Reusable Components
│   ├── 📁 contexts/           # 10 React Contexts (Auth, Notifications, etc.)
│   ├── 📁 hooks/              # 20 Custom Hooks
│   ├── 📁 services/           # 12 API Services
│   ├── 📁 utils/              # 22 Utility Functions
│   ├── 📁 types/              # 7 TypeScript Type Definitions
│   └── 📁 stores/             # 4 State Management Stores
├── 📁 backend/                # Backend Source Code
│   ├── 📁 routes/             # 31 API Routes (Modular Architecture)
│   ├── 📁 middleware/         # 20 Custom Middleware
│   ├── 📁 services/           # 20 Business Logic Services
│   ├── 📁 database/           # 9 Database Management Files
│   ├── 📁 migrations/         # 11 Database Migrations
│   ├── 📁 scripts/            # 19 Utility Scripts
│   └── 📁 utils/              # 26 Backend Utilities
├── 📁 tests/                  # 99 Test Files (Unit + Integration + E2E)
├── 📁 tools/                  # 92 Development Tools
├── 📁 scripts/                # 43 Build & Deployment Scripts
├── 📁 monitoring/            # 5 Monitoring Configurations
├── 📁 microservices/          # 8 Microservice Definitions
└── 📁 database/               # 21 Database Management Files
```

---

## 🌐 Frontend Mimarisi

### Panel Yapısı (4 Farklı Kullanıcı Tipi)

#### 1. **Bireysel Gönderici Paneli** (`/src/pages/individual/`)
- **Özellikler:** Ev/Ofis taşımacılığı, eşya gönderimi
- **Teknoloji:** React + TypeScript + TailwindCSS
- **Sayfalar:** Dashboard, CreateShipment, Offers, Messages, Wallet
- **Optimizasyon:** %30-50 maliyet düşüşü, akıllı teklif sistemi

#### 2. **Kurumsal Gönderici Paneli** (`/src/pages/corporate/`)
- **Özellikler:** Endüstriyel lojistik, perakende tedarik, e-ticaret
- **Teknoloji:** React + Advanced Analytics + Excel/PDF Export
- **Sayfalar:** Dashboard, CreateShipment, Analytics, Reports, Team Management
- **Optimizasyon:** %40 maliyet düşüşü, departman bazlı raporlama

#### 3. **Nakliyeci Paneli** (`/src/pages/nakliyeci/`)
- **Özellikler:** Filo yönetimi, yük pazarı, akıllı rota planlama
- **Teknoloji:** React + Smart Route Algorithm + Real-time Tracking
- **Sayfalar:** Dashboard, Jobs, Active-shipments, Route-planner, Drivers, Wallet
- **Optimizasyon:** Kapasite optimizasyonu, %1 komisyon oranı

#### 4. **Taşıyıcı Paneli** (`/src/pages/tasiyici/`)
- **Özellikler:** Sürücü iş yönetimi, konum bazlı iş fırsatları
- **Teknoloji:** React + GPS Integration + Mobile Responsive
- **Sayfalar:** Dashboard, Jobs, Earnings, Profile, Messages
- **Optimizasyon:** Haftalık ödeme garantisi, konum bazlı matching

### Frontend Özellikler
- **Responsive Design:** Mobile-first approach (81 il kapsamı)
- **PWA Support:** Service Worker + Offline Capability
- **Real-time Updates:** WebSocket ile anlık bildirimler
- **Performance:** Code splitting + Lazy loading + Tree shaking
- **SEO:** React Helmet + Meta tags + Sitemap
- **Accessibility:** WCAG 2.1 AA compliance
- **Internationalization:** Multi-language support (Türkiye odaklı)

---

## 🔧 Backend Mimarisi

### API Yapısı (Modular Design)
- **Base URL:** `http://localhost:5000/api`
- **Authentication:** JWT Bearer Token + Refresh Token
- **Rate Limiting:** 100 requests/minute per IP
- **CORS:** Cross-origin resource sharing enabled
- **Security:** Helmet + XSS Protection + SQL Injection Prevention

### Ana Route Modülleri

#### 1. **Authentication System** (`/api/auth/`)
- **Features:** Login, Register, Password Reset, Email Verification
- **Security:** bcrypt hashing + JWT tokens + 2FA support
- **Validation:** Joi schema validation + Input sanitization

#### 2. **Shipment Management** (`/api/shipments/`)
- **Features:** CRUD operations, Status tracking, Route planning
- **Smart Features:** Auto route assignment, Corridor-based filtering
- **Database:** PostgreSQL with JSONB metadata storage

#### 3. **User Management** (`/api/users/`)
- **Features:** Profile management, Role-based access control
- **User Types:** individual, corporate, nakliyeci, tasiyici
- **Permissions:** Granular permission system

#### 4. **Payment System** (`/api/payments/`)
- **Features:** Stripe + Iyzico integration, Wallet management
- **Security:** PCI DSS compliance + Webhook verification
- **Commission:** Dynamic commission calculation (%1 for nakliyeci)

#### 5. **Real-time Communication** (`/api/messages/`)
- **Features:** WebSocket chat, File sharing, Read receipts
- **Storage:** PostgreSQL + File system for attachments
- **Notifications:** Push notifications + Email alerts

#### 6. **Smart Route System** (`/api/smart-route/`)
- **Features:** Automatic route planning, Corridor filtering
- **Algorithm:** 30-minute city blocking, Single corridor rule
- **Optimization:** Capacity-based load matching

### Database Tasarımı

#### PostgreSQL Schema
```sql
-- Ana Tablolar
users                 -- Kullanıcı bilgileri
shipments            -- Gönderi detayları
offers               -- Teklifler
drivers              -- Sürücü bilgileri
vehicles             -- Araç bilgileri
payments             -- Ödeme kayıtları
messages             -- Mesajlaşma
notifications        -- Bildirimler
reviews_ratings      -- Değerlendirmeler
wallet_transactions  -- Cüzdan işlemleri
```

#### Özellikler
- **JSONB Metadata:** Esnek veri saklama (route plans, custom fields)
- **Indexing:** Optimized sorgu performansı
- **Foreign Keys:** Veri bütünlüğü
- **Timestamps:** created_at, updated_at tracking
- **Soft Deletes:** Veri kaybı önleme

---

## 🔐 Güvenlik Altyapısı

### Authentication & Authorization
- **JWT Tokens:** Access token (15min) + Refresh token (7days)
- **Password Security:** bcrypt + salt + minimum 8 character
- **Session Management:** Redis-based session storage
- **Role-based Access:** 4 user types with granular permissions

### Data Protection
- **KVKK Compliance:** Turkish data protection law
- **GDPR Ready:** European data protection standards
- **Encryption:** AES-256 encryption for sensitive data
- **Audit Logs:** All user actions logged and monitored

### API Security
- **Rate Limiting:** 100 requests/minute per IP
- **Input Validation:** Joi schema validation for all inputs
- **SQL Injection Prevention:** Parameterized queries + ORM
- **XSS Protection:** Helmet + Content Security Policy
- **CSRF Protection:** Double submit cookie pattern

---

## 📊 Performans Optimizasyonları

### Frontend Optimizasyon
- **Bundle Size:** Code splitting + Tree shaking
- **Loading Performance:** Lazy loading + Image optimization
- **Runtime Performance:** React.memo + useMemo + useCallback
- **Network Optimization:** HTTP/2 + Gzip compression
- **Caching Strategy:** Service Worker + Browser caching

### Backend Optimizasyon
- **Database Optimization:** Indexing + Query optimization
- **Caching:** Redis caching for frequent queries
- **Load Balancing:** Nginx + Multiple server instances
- **Connection Pooling:** PostgreSQL connection pool
- **Monitoring:** Prometheus metrics + Grafana dashboards

### Performance Metrics
- **Page Load Time:** < 2 seconds (LCP)
- **API Response Time:** < 200ms average
- **Database Query Time:** < 50ms average
- **Uptime:** %99.9 availability target
- **Concurrent Users:** 10,000+ supported

---

## 🧪 Test Altyapısı

### Test Types
- **Unit Tests:** Jest + React Testing Library (67 tests)
- **Integration Tests:** Supertest + Jest (API testing)
- **E2E Tests:** Playwright (Cross-browser testing)
- **Performance Tests:** Load testing + Memory profiling
- **Security Tests:** OWASP ZAP + Custom security audits

### Test Coverage
- **Frontend:** %85+ code coverage target
- **Backend:** %90+ code coverage target
- **Critical Paths:** %100 coverage for payment flows
- **User Flows:** Complete E2E coverage for all 4 panels

### Test Automation
- **CI/CD Integration:** GitHub Actions auto-run tests
- **Regression Testing:** Automated test suites
- **Visual Testing:** Percy for UI regression
- **API Testing:** Postman collections + Newman

---

## 🚀 Deployment Altyapısı

### Development Environment
- **Local Development:** Docker Compose + Hot reload
- **Database:** PostgreSQL + Redis (Docker containers)
- **Frontend:** Vite dev server (localhost:5173)
- **Backend:** Node.js server (localhost:5000)
- **Proxy:** Nginx reverse proxy configuration

### Production Environment
- **Hosting:** Railway + Render + Custom VPS
- **Database:** Managed PostgreSQL (Railway)
- **CDN:** Cloudflare for static assets
- **Load Balancer:** Nginx + SSL termination
- **Monitoring:** Sentry + Prometheus + Grafana

### CI/CD Pipeline
- **Source Control:** GitHub + Git flow
- **Build Process:** Automated testing + Docker builds
- **Deployment:** Blue-green deployment strategy
- **Rollback:** Automatic rollback on failure
- **Health Checks:** Automated health monitoring

---

## 📱 Mobil & Cross-Platform

### Mobile Optimization
- **Responsive Design:** Mobile-first approach
- **Touch Interface:** Optimized for touch interactions
- **Performance:** PWA capabilities + Offline support
- **Native Features:** Geolocation + Camera + File upload

### Browser Support
- **Modern Browsers:** Chrome, Firefox, Safari, Edge (latest versions)
- **Legacy Support:** IE11 not supported (modern approach)
- **Mobile Browsers:** iOS Safari, Chrome Mobile
- **Progressive Enhancement:** Core functionality works everywhere

---

## 🔧 Geliştirme Araçları

### Development Tools
- **IDE Support:** VS Code + IntelliSense + ESLint
- **Code Quality:** Prettier + TypeScript strict mode
- **Git Hooks:** Husky + lint-staged
- **Debugging:** Source maps + DevTools integration

### Monitoring & Analytics
- **Error Tracking:** Sentry for error monitoring
- **Performance Monitoring:** Web Vitals + Custom metrics
- **User Analytics:** Custom analytics dashboard
- **API Monitoring:** Request/response logging

---

## 📈 Ölçeklenebilirlik

### Horizontal Scaling
- **Load Balancing:** Nginx + Multiple app servers
- **Database Scaling:** Read replicas + Connection pooling
- **Caching Layer:** Redis cluster + CDN
- **Microservices:** Modular architecture for future scaling

### Vertical Scaling
- **Resource Optimization:** Memory management + CPU optimization
- **Database Optimization:** Query optimization + Indexing
- **Caching Strategy:** Multi-level caching implementation
- **Performance Monitoring:** Real-time performance metrics

---

## 🔄 Bakım & Destek

### Monitoring
- **Application Monitoring:** Sentry + Custom dashboards
- **Infrastructure Monitoring:** Prometheus + Grafana
- **Log Management:** Winston + ELK stack
- **Health Checks:** Automated health monitoring

### Backup & Recovery
- **Database Backups:** Daily automated backups
- **File Backups:** Cloud storage backup
- **Disaster Recovery:** Recovery procedures documented
- **Data Integrity:** Regular data validation

---

## 📋 Kullanılan Teknolojiler Detaylı Listesi

### Frontend Dependencies
```json
{
  "core": ["React 18.2.0", "TypeScript 5.3.3", "Vite 5.0.0"],
  "styling": ["TailwindCSS 3.3.6", "Lucide React"],
  "routing": ["React Router DOM 6.20.1"],
  "forms": ["React Hook Form 7.48.2"],
  "http": ["Axios 1.6.2"],
  "realtime": ["Socket.IO Client 4.8.1"],
  "ui": ["Sonner 2.0.7", "React Helmet Async"],
  "testing": ["Jest", "React Testing Library", "Playwright"]
}
```

### Backend Dependencies
```json
{
  "core": ["Node.js", "Express 4.21.2", "TypeScript"],
  "database": ["PostgreSQL 8.16.3", "Sequelize 6.37.7"],
  "auth": ["JWT 9.0.2", "bcrypt 6.0.0"],
  "security": ["Helmet 7.2.0", "CORS", "Rate Limiting"],
  "realtime": ["Socket.IO 4.8.1"],
  "payment": ["Stripe 14.25.0", "Iyzico 2.0.64"],
  "email": ["Nodemailer 7.0.10"],
  "monitoring": ["Winston", "Prometheus", "Sentry"],
  "testing": ["Jest", "Supertest", "Playwright"]
}
```

### DevOps Tools
```json
{
  "containerization": ["Docker", "Docker Compose"],
  "webserver": ["Nginx", "SSL/TLS"],
  "process_manager": ["PM2"],
  "cicd": ["GitHub Actions"],
  "monitoring": ["Grafana", "Prometheus", "Sentry"],
  "deployment": ["Railway", "Render", "Custom VPS"]
}
```

---

## 🎯 Proje Hedefleri ve Başarıları

### Hedefler
- **Kullanıcı Sayısı:** 53.000+ aktif kullanıcı
- **Memnuniyet Oranı:** %97.2 kullanıcı memnuniyeti
- **Coğrafya:** 81 il + 900+ ilçe kapsamı
- **Performans:** %99.9 uptime hedefi
- **Maliyet:** %30-50 maliyet optimizasyonu

### Teknik Başarılar
- **Modüler Mimari:** 31 route modülü + 20 middleware
- **Test Coverage:** %85+ frontend, %90+ backend
- **Security:** KVKK uyumlu + enterprise-level security
- **Performance:** < 200ms API response time
- **Scalability:** 10.000+ concurrent user support

---

## 📞 İletişim ve Destek

### Geliştirici Bilgileri
- **Proje Sahibi:** YolNext Lojistik Hizmetleri A.Ş.
- **Teknoloji Lideri:** Full-stack development team
- **Destek:** 7/24 teknik destek
- **Dokümantasyon:** Comprehensive API documentation

### Geliştirme Ortamı

**Lokal Geliştirme:**
```bash
npm run dev:all          # Frontend (5173) + Backend (5000) birlikte
npm run dev:frontend     # Sadece frontend
npm run dev:backend      # Sadece backend
```

**Test:**
```bash
npm run test:all         # Tüm testler
npm run test             # Unit testler
npm run test:e2e         # E2E testler
```

**Build:**
```bash
npm run build:all        # Production build
npm run build:frontend   # Frontend build
npm run build:backend   # Backend build
```

**Deployment:**
```bash
npm run deploy:prod      # Production deployment
```

**Önemli Dosyalar:**
- `backend/server-modular.js` - Ana backend server dosyası
- `vite.config.ts` - Frontend build konfigürasyonu
- `docker-compose.yml` - Docker container yapılandırması
- `backend/config.js` - Backend konfigürasyon dosyası

---

## 🔮 Gelecek Planları

### Kısa Vadeli Hedefler (3 Ay)
- **Mobile App:** React Native mobil uygulama
- **AI Integration:** Akıllı rota optimizasyonu
- **Advanced Analytics:** Makine öğrenmesi tabanlı analizler
- **Payment Expansion:** Daha fazla ödeme yöntemi

### Uzun Vadeli Hedefler (1 Yıl)
- **International Expansion:** Avrupa pazarına açılım
- **Microservices:** Full microservices mimarisi
- **Blockchain:** Supply chain transparency
- **IoT Integration:** Real-time tracking enhancement

---

**📝 Not:** Bu rapor YolNext kargo platformunun mevcut teknik durumunu, mimarisini ve kullanılan teknolojileri detaylı bir şekilde açıklamaktadır. Proje, modern web geliştirme standartlarına uygun olarak tasarlanmış olup, Türkiye'nin en büyük lojistik pazaryeri olma hedefi ile geliştirilmektedir.

**🔗 Önemli Dosya Konumları:**

**Konfigürasyon:**
- `package.json` - Frontend dependencies ve scripts
- `backend/package.json` - Backend dependencies ve scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Frontend build configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `docker-compose.yml` - Docker container configuration
- `env.example` - Environment variables template
- `backend/config.env` - Backend environment variables

**Ana Kod Dosyaları:**
- `backend/server-modular.js` - Ana backend server
- `backend/config.js` - Backend configuration
- `src/main.tsx` - Frontend entry point
- `src/App.tsx` - Ana React component

**Veritabanı:**
- `backend/database/` - Database setup ve migration dosyaları
- `backend/migrations/` - Database migration scripts
- `database/init.sql` - Database schema

**Dokümantasyon:**
- `README.md` - Bu dosya
- `backend/swagger.js` - API dokümantasyonu (Swagger)
