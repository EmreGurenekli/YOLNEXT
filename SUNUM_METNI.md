# YolNext Projesi - Sunum Metinleri

## 👨‍👩‍👧‍👦 AİLE İÇİN SUNUM METNİ

Merhaba,

Bugün size üzerinde çalıştığım bir projeyi anlatmak istiyorum. Projenin adı **YolNext** ve Türkiye'nin lojistik sektörü için bir dijital platform.

### Proje Nedir?

YolNext, kargo ve nakliye işlerini internet üzerinden yönetmeyi sağlayan bir platform. Düşünün ki, bir şey göndermek istediğinizde veya taşımacılık yapan bir şirket olduğunuzda, eskiden telefonla arayıp fiyat soruyordunuz. Artık bu platform sayesinde her şey online olarak, daha hızlı ve daha uygun fiyatlarla yapılabiliyor.

### Kimler Kullanıyor?

Platform dört farklı kullanıcı tipine hizmet veriyor:

1. **Bireysel Göndericiler** - Ev taşıma, eşya gönderimi yapan kişiler
2. **Kurumsal Göndericiler** - Şirketler, e-ticaret siteleri
3. **Nakliyeci Firmalar** - Taşımacılık yapan şirketler
4. **Taşıyıcılar** - Bireysel sürücüler, kamyon sahipleri

### Ne İşe Yarar?

- Gönderici, göndermek istediği yükü sisteme giriyor
- Sistem, bu yükü taşıyabilecek nakliyeci ve taşıyıcıları buluyor
- Herkes birbirine teklif veriyor, en uygun fiyatı seçiyor
- Tüm süreç online takip ediliyor - nerede, ne zaman, kim taşıyor, her şey görünüyor
- Ödemeler güvenli bir şekilde platform üzerinden yapılıyor

### Teknik Tarafı

Platform iki ana bölümden oluşuyor:
- **Ön yüz (Frontend)**: Kullanıcıların gördüğü, etkileşimde bulunduğu arayüz. Modern web teknolojileriyle geliştirildi.
- **Arka yüz (Backend)**: Sistemin çalışmasını sağlayan, verileri yöneten kısım. Güvenli ve hızlı çalışacak şekilde tasarlandı.

### Önemli Özellikler

- **Güvenlik**: Tüm veriler şifreleniyor, ödemeler güvenli
- **Hız**: İşlemler anında gerçekleşiyor
- **Kapsam**: Türkiye'nin 81 ilinde hizmet veriyor
- **Maliyet Avantajı**: Kullanıcılar %30-50 daha uygun fiyatlarla taşımacılık yapabiliyor

### Neden Önemli?

Türkiye'de lojistik sektörü hala çok geleneksel yöntemlerle çalışıyor. Bu platform, sektörü dijitalleştiriyor ve hem göndericilere hem de taşıyıcılara fayda sağlıyor. Modern, güvenli ve kullanıcı dostu bir çözüm sunuyor.

---

## 💻 YAZILIMCI İÇİN SUNUM METNİ

Merhaba,

YolNext projesi hakkında kısa bir özet paylaşmak istiyorum.

### Proje Özeti

**YolNext**, Türkiye'nin lojistik pazaryeri platformu. Full-stack bir web uygulaması olarak geliştirildi. 4 farklı kullanıcı tipine (Bireysel Gönderici, Kurumsal Gönderici, Nakliyeci, Taşıyıcı) özel paneller sunuyor.

### Teknoloji Stack

**Frontend:**
- React 18.2 + TypeScript 5.3
- Vite 5.0 (build tool)
- TailwindCSS 3.3
- React Router, Axios, Socket.IO Client
- Jest + Playwright (testing)

**Backend:**
- Node.js + Express 4.21
- PostgreSQL 8.16 (production) / SQLite (dev)
- Sequelize ORM
- JWT authentication + bcrypt
- Socket.IO (real-time)
- Stripe + Iyzico (payment)

**DevOps:**
- Docker + Docker Compose
- Nginx (reverse proxy + load balancer)
- PM2 (process management)
- Railway + Render (deployment)
- Prometheus + Grafana (monitoring)

### Mimari Yapı

**Frontend:**
- 89 sayfa komponenti (4 panel tipi için)
- 78 yeniden kullanılabilir komponent
- 10 React Context (state management)
- 20 custom hook
- Modüler yapı, code splitting, lazy loading

**Backend:**
- 31 modüler API route
- 20 middleware (auth, validation, error handling)
- 20 business logic service
- 11 database migration
- RESTful API + WebSocket desteği

### Önemli Özellikler

**Güvenlik:**
- JWT token authentication (access + refresh)
- Rate limiting (100 req/min)
- Input validation (Joi)
- SQL injection prevention
- XSS protection (Helmet)
- KVKK uyumlu

**Performans:**
- API response time: < 200ms
- Database query: < 50ms
- Code splitting + tree shaking
- Redis caching (frequent queries)
- Connection pooling

**Test Coverage:**
- %85+ frontend coverage
- %90+ backend coverage
- 99 test dosyası (unit + integration + E2E)
- CI/CD entegrasyonu

### Veritabanı Tasarımı

PostgreSQL kullanılıyor. Ana tablolar:
- users, shipments, offers
- drivers, vehicles
- payments, wallet_transactions
- messages, notifications
- reviews_ratings

JSONB metadata desteği, optimized indexing, foreign key constraints, soft deletes.

### Ölçeklenebilirlik

- Horizontal scaling: Nginx load balancer
- Database: Read replicas + connection pooling
- Caching: Redis cluster
- 10,000+ concurrent user desteği
- %99.9 uptime hedefi

### Proje Durumu

- Production-ready
- Comprehensive test coverage
- Monitoring ve logging altyapısı mevcut
- CI/CD pipeline kurulu
- Dokümantasyon tamamlanmış

### İlginç Detaylar

- 4 farklı kullanıcı tipi için ayrı paneller ve iş akışları
- Akıllı rota planlama algoritması (corridor-based filtering)
- Real-time mesajlaşma ve bildirimler
- Dinamik komisyon hesaplama sistemi
- Multi-payment gateway entegrasyonu

Proje, modern web geliştirme standartlarına uygun, modüler ve ölçeklenebilir bir mimariyle geliştirildi. Kod kalitesi, güvenlik ve performans ön planda tutuldu.


