# 📚 API Documentation

YolNext platform API endpoint'leri ve kullanım rehberi.

---

## 🔐 Authentication

Tüm protected endpoint'ler için JWT token gereklidir.

**Header:**
```
Authorization: Bearer <token>
```

---

## 📦 Shipments API

### GET /api/shipments
Kullanıcının gönderilerini getirir.

**Query Parameters:**
- `page` (number): Sayfa numarası (default: 1)
- `limit` (number): Sayfa başına kayıt (default: 10)
- `status` (string): Durum filtresi (pending, in_transit, delivered, cancelled)
- `search` (string): Arama terimi

**Response:**
```json
{
  "success": true,
  "data": {
    "shipments": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### POST /api/shipments
Yeni gönderi oluşturur.

**Request Body:**
```json
{
  "title": "Gönderi Başlığı",
  "description": "Açıklama",
  "productDescription": "Ürün açıklaması",
  "category": "house_move",
  "pickupCity": "İstanbul",
  "pickupDistrict": "Kadıköy",
  "pickupAddress": "Tam adres",
  "pickupDate": "2025-03-10",
  "deliveryCity": "Ankara",
  "deliveryDistrict": "Çankaya",
  "deliveryAddress": "Tam adres",
  "deliveryDate": "2025-03-12",
  "weight": 1.5,
  "specialRequirements": "Özel gereksinimler"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gönderi başarıyla oluşturuldu",
  "data": {
    "shipment": {...},
    "id": 123,
    "trackingNumber": "YN123456789"
  }
}
```

### GET /api/shipments/open
Açık gönderileri getirir (nakliyeci için).

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `status` (string): pending, open
- `search` (string)

**Response:**
```json
{
  "success": true,
  "data": {
    "shipments": [...],
    "pagination": {...}
  }
}
```

### GET /api/shipments/tasiyici
Taşıyıcıya atanmış gönderileri getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "shipments": [...]
  }
}
```

---

## 💰 Offers API

### POST /api/offers
Gönderi için teklif oluşturur.

**Request Body:**
```json
{
  "shipmentId": 123,
  "price": 5000,
  "message": "Teklif mesajı",
  "estimatedDeliveryDays": 2,
  "insuranceIncluded": false,
  "specialServices": ["packaging", "assembly"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Teklif başarıyla gönderildi",
  "data": {
    "offer": {...}
  }
}
```

---

## 👤 User API

### GET /api/users/profile
Kullanıcı profil bilgilerini getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "fullName": "Kullanıcı Adı",
      "email": "user@example.com",
      "role": "individual",
      ...
    }
  }
}
```

---

## 📊 Dashboard API

### GET /api/dashboard/stats/:userType
Kullanıcı tipine göre istatistikleri getirir.

**userType:** individual, corporate, nakliyeci, tasiyici

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalShipments": 10,
      "deliveredShipments": 8,
      "pendingShipments": 2,
      "successRate": 80,
      ...
    }
  }
}
```

---

## 🔔 Notifications API

### GET /api/notifications
Kullanıcı bildirimlerini getirir.

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `unread` (boolean): Sadece okunmamışlar

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": {...}
  }
}
```

### GET /api/notifications/unread-count
Okunmamış bildirim sayısını getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

## 🔐 Authentication API

### POST /api/auth/login
Kullanıcı girişi.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {...}
  }
}
```

### POST /api/auth/register
Yeni kullanıcı kaydı.

**Request Body:**
```json
{
  "firstName": "Ad",
  "lastName": "Soyad",
  "email": "user@example.com",
  "phone": "+905551234567",
  "password": "password",
  "userType": "individual"
}
```

### POST /api/auth/demo-login
Demo kullanıcı girişi (development only).

**Request Body:**
```json
{
  "userType": "individual"
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": {...}
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Error message" // Only in development
}
```

---

## 🔄 Rate Limiting

- **Auth endpoints:** 5 requests / 15 minutes
- **General API:** 100 requests / minute
- **File upload:** 10 requests / minute
- **Payment:** 20 requests / hour

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## 📝 Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (httpOnly cookies recommended)
3. **Handle errors gracefully** with user-friendly messages
4. **Implement retry logic** for failed requests
5. **Use pagination** for large datasets
6. **Cache responses** when appropriate

---

**Son Güncelleme:** 2025-01-11

