# 🚀 YolNet Mikroservis Mimarisi

## 📋 Genel Bakış

YolNet platformu artık **mikroservis mimarisi** ile çalışıyor! Her servis kendi sorumluluğunu üstleniyor ve bağımsız olarak ölçeklenebiliyor.

## 🏗️ Mimari Yapı

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Auth Service  │
│   (React)       │◄───┤   (Port 3000)   │◄───┤   (Port 3001)   │
│   Port 5173     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Cache Service │
                       │   (Port 3008)   │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   (Port 6379)   │
                       └─────────────────┘
```

## 🛠️ Servisler

### 1. **API Gateway** (Port 3000)
- **Görev:** Tüm istekleri yönlendirme
- **Özellikler:**
  - JWT authentication
  - Rate limiting
  - Request routing
  - Response caching
  - Load balancing

### 2. **Auth Service** (Port 3001)
- **Görev:** Kullanıcı kimlik doğrulama
- **Özellikler:**
  - User registration/login
  - JWT token management
  - Password hashing
  - User profile management

### 3. **Cache Service** (Port 3008)
- **Görev:** Redis cache yönetimi
- **Özellikler:**
  - Cache operations
  - Cache statistics
  - Cache invalidation
  - Performance monitoring

## 🗄️ Veritabanları

### 1. **Redis** (Port 6379)
- **Görev:** Cache ve session storage
- **Özellikler:**
  - In-memory storage
  - High performance
  - Data persistence
  - Pub/Sub messaging

### 2. **PostgreSQL** (Port 5432)
- **Görev:** Ana veritabanı
- **Özellikler:**
  - ACID compliance
  - Complex queries
  - Data integrity
  - Scalability

### 3. **MongoDB** (Port 27017)
- **Görev:** NoSQL veri depolama
- **Özellikler:**
  - Document storage
  - Flexible schema
  - Horizontal scaling
  - JSON-like documents

## 🐳 Docker Containerization

### Başlatma
```bash
# Windows
start-microservices.bat

# Linux/Mac
./start-microservices.sh

# Manuel
docker-compose up -d
```

### Durdurma
```bash
docker-compose down
```

### Logları Görme
```bash
docker-compose logs -f
```

## 🔧 Geliştirme

### Servis Bağımsız Geliştirme
Her servis kendi klasöründe bağımsız olarak geliştirilebilir:

```bash
# Auth Service
cd microservices/auth-service
npm install
npm run dev

# API Gateway
cd microservices/api-gateway
npm install
npm run dev
```

### Environment Variables
```env
# API Gateway
NODE_ENV=production
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-secret-key

# Auth Service
NODE_ENV=production
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-secret-key

# Database
POSTGRES_DB=yolnet
POSTGRES_USER=yolnet_user
POSTGRES_PASSWORD=yolnet_password
```

## 📊 Monitoring

### Health Checks
- **API Gateway:** http://localhost:3000/api/health
- **Auth Service:** http://localhost:3001/health
- **Cache Service:** http://localhost:3008/health

### Service Status
```bash
docker-compose ps
```

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Production environment variables
cp .env.example .env.production
# Edit .env.production with production values
```

### 2. Build and Deploy
```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Monitoring
```bash
# Check service health
curl http://localhost:3000/api/health

# View logs
docker-compose logs -f api-gateway
```

## 🔒 Security

### 1. JWT Authentication
- Secure token generation
- Token expiration
- Refresh token support

### 2. Rate Limiting
- API request limiting
- IP-based throttling
- Service protection

### 3. CORS Configuration
- Cross-origin request handling
- Security headers
- Request validation

## 📈 Scalability

### 1. Horizontal Scaling
```bash
# Scale specific service
docker-compose up -d --scale auth-service=3
```

### 2. Load Balancing
- Nginx reverse proxy
- Service discovery
- Health checks

### 3. Database Scaling
- Read replicas
- Connection pooling
- Query optimization

## 🐛 Troubleshooting

### Common Issues

1. **Service Not Starting**
   ```bash
   docker-compose logs service-name
   ```

2. **Database Connection Issues**
   ```bash
   docker-compose exec postgres psql -U yolnet_user -d yolnet
   ```

3. **Redis Connection Issues**
   ```bash
   docker-compose exec redis redis-cli
   ```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development docker-compose up
```

## 📚 API Documentation

### Authentication
```bash
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/verify
GET  /api/auth/me
```

### Cache Management
```bash
GET    /api/cache/:key
POST   /api/cache
DELETE /api/cache/:key
GET    /api/cache/stats
```

## 🎯 Next Steps

1. **Service Mesh** (Istio)
2. **Kubernetes** deployment
3. **CI/CD** pipeline
4. **Monitoring** (Prometheus/Grafana)
5. **Logging** (ELK Stack)

---

**YolNet Mikroservis Mimarisi** - Modern, ölçeklenebilir ve güvenli platform! 🚀





